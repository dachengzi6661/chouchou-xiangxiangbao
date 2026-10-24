#!/usr/bin/env node
/**
 * check-secrets.js — 提交前自查：扫 Token / 密钥 / 个人信息
 *
 * 用法：
 *   node scripts/check-secrets.js
 *   node scripts/check-secrets.js --all     # 连 shots/ 与 out/ 也扫（默认跳过二进制与产物）
 *
 * 退出码：0 = 干净；1 = 有命中，逐条列出行号（值会打码）
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCAN_ALL = process.argv.includes('--all');

const SKIP_DIRS = new Set(['.git', 'node_modules', 'out', '.vscode', '.idea']);
const SKIP_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2', '.zip', '.pdf']);
const MAX_BYTES = 512 * 1024;

const RULES = [
  {
    id: 'bearer',
    label: '疑似真实 Bearer Token',
    re: /Bearer\s+(?!\$\{)[A-Za-z0-9\-._~+/=]{16,}/g
  },
  {
    id: 'env-value',
    label: '环境变量被写了真实值（应为 ${...} 占位符）',
    re: /(?:MCD_MCP_TOKEN|MCP_TOKEN|API_KEY|SECRET|PASSWORD|ACCESS_KEY)[ \t]*[:=][ \t]*['"]?(?!\$\{|<|你的|your|YOUR)[A-Za-z0-9\-._~+/=]{12,}/g
  },
  {
    id: 'sk-key',
    label: '疑似厂商密钥（sk- / AKID 前缀）',
    re: /\b(?:sk-[A-Za-z0-9]{16,}|AKID[A-Za-z0-9]{12,})\b/g
  },
  {
    id: 'email',
    label: '邮箱地址',
    re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g
  },
  {
    id: 'cn-mobile',
    label: '手机号',
    re: /(?<!\d)1[3-9]\d{9}(?!\d)/g
  },
  {
    id: 'win-user-path',
    label: 'Windows 本机路径（含用户名）',
    re: /[A-Za-z]:[\\/]Users[\\/][^\\/\s"']+/g
  },
  {
    id: 'mac-user-path',
    label: 'macOS 本机路径（含用户名）',
    re: /\/Users\/[A-Za-z0-9._-]+\//g
  }
];

function mask(s) {
  const str = String(s);
  if (str.length <= 8) return str[0] + '***';
  return str.slice(0, 4) + '***' + str.slice(-2) + '  (len=' + str.length + ')';
}

function walk(dir, out) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      if (!SCAN_ALL && name === 'shots') continue;
      walk(full, out);
    } else {
      if (SKIP_EXT.has(path.extname(name).toLowerCase())) continue;
      if (st.size > MAX_BYTES) continue;
      out.push(full);
    }
  }
  return out;
}

const files = walk(ROOT, []);
const hits = [];

for (const file of files) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (e) {
    continue;
  }
  if (text.indexOf('\u0000') !== -1) continue; // 二进制

  const lines = text.split(/\r?\n/);
  lines.forEach((line, idx) => {
    RULES.forEach(rule => {
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(line)) !== null) {
        hits.push({
          file: path.relative(ROOT, file),
          line: idx + 1,
          rule: rule.label,
          sample: mask(m[0])
        });
        if (m.index === rule.re.lastIndex) rule.re.lastIndex++;
      }
    });
  });
}

console.log('');
console.log('  扫描目录：' + ROOT);
console.log('  扫描文件：' + files.length + ' 个' + (SCAN_ALL ? '（含产物）' : '（跳过 shots/ 与 out/）'));
console.log('');

if (!hits.length) {
  console.log('  ✓ 没有发现 Token / 密钥 / 邮箱 / 手机号 / 本机路径');
  console.log('');
  process.exit(0);
}

console.log('  ✗ 命中 ' + hits.length + ' 处，逐条核对：');
console.log('');
hits.forEach((h, i) => {
  console.log('  ' + String(i + 1).padStart(2) + '. [' + h.rule + ']');
  console.log('      ' + h.file + ':' + h.line + '  →  ' + h.sample);
});
console.log('');
console.log('  处理建议：');
console.log('    · Token / 密钥：立即删除并到平台重置，历史提交要用 git filter-repo 清');
console.log('    · 邮箱 / 手机号：改成占位符或删除');
console.log('    · 本机路径：改成环境变量探测（见 test-browser.js 的 CHROME_BIN 写法）');
console.log('');
process.exit(1);
