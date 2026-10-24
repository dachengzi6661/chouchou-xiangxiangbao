#!/usr/bin/env node
/**
 * compose.js — 真实版（Skill）的组合合成器
 * ---------------------------------------------------------------------------
 * 输入：一个 combo.json，内含**从 mcd-mcp 真实返回里摘出来的字段**
 * 输出：终端打印名字 / 口号 / 总价 / 热量，并生成 poster.svg
 *
 * 用法：
 *   node skill/scripts/compose.js skill/examples/combo.example.json [outDir]
 *
 * 这个脚本**不联网、不读 Token**，只做三件事：求和、起名、出图。
 * 查菜单、核价、营养都必须在前面由 Agent 调 mcd-mcp 完成，结果写进 combo.json。
 * ---------------------------------------------------------------------------
 */
'use strict';

const fs = require('fs');
const path = require('path');
const L = require('../../logic.js');

const C = {
  bg0: '#1B0C08', bg1: '#3C0F09', bg2: '#100504',
  yellow: '#FFC72C', cream: '#F6EEE3', dim: 'rgba(246,238,227,.45)',
  red: '#FF8A7A'
};

function die(msg) {
  console.error('✗ ' + msg);
  process.exit(1);
}

/* ------------------------------ 入参 ------------------------------ */

const inPath = process.argv[2];
const outDir = process.argv[3] || '.';
if (!inPath) die('用法: node compose.js <combo.json> [outDir]');

let input;
try {
  input = JSON.parse(fs.readFileSync(inPath, 'utf8'));
} catch (e) {
  die('读取 combo.json 失败：' + e.message);
}

const items = input.items;
if (!Array.isArray(items)) die('combo.json 缺少 items 数组');
if (items.length < 2 || items.length > 4) die('items 必须是 2–4 个单品，当前 ' + items.length + ' 个');

const codes = items.map(function (i) { return i.code; });
if (new Set(codes).size !== codes.length) die('items 里有重复的 productCode');
if (codes.some(function (c) { return !c; })) die('有单品缺少 code');

items.forEach(function (it) {
  if (!Number.isInteger(it.subtotalFen) || it.subtotalFen < 0) {
    die('「' + (it.detailName || it.code) + '」的 subtotalFen 必须是 calculate-price 返回的整数分');
  }
  if (it.kcal !== null && it.kcal !== undefined && !Number.isFinite(Number(it.kcal))) {
    die('「' + (it.detailName || it.code) + '」的 kcal 只能是数字或 null（查不到就写 null，不要估）');
  }
});

/* ------------------------------ 求和 ------------------------------ */

// 价格：唯一来源是 calculate-price 的逐项 subtotal（分），这里只做整数相加
const totalFen = items.reduce(function (s, i) { return s + i.subtotalFen; }, 0);

// 热量：null 视为「未知」，不计入、不估算
const unknown = items.filter(function (i) { return i.kcal === null || i.kcal === undefined; });
const kcal = items.reduce(function (s, i) {
  return s + (i.kcal === null || i.kcal === undefined ? 0 : Number(i.kcal));
}, 0);
const allKnown = unknown.length === 0;

/* ------------------------------ 起名 ------------------------------ */

const nameMap = {};
items.forEach(function (i) { nameMap[i.code] = i.detailName || i.code; });
const nm = L.generateName(codes, nameMap);

/* ------------------------------ 输出 ------------------------------ */

const store = input.store || {};
const yuan = (totalFen / 100).toFixed(2);

console.log('');
console.log('  ' + nm.name);
console.log('  「' + nm.slogan + '」');
console.log('');
console.log('  总价   ¥' + yuan + '   （' + totalFen + ' 分）');
console.log('  热量   ' + (allKnown ? kcal + ' 千卡' : kcal + ' 千卡 + ' + unknown.length + ' 项未知'));
console.log('  单品   ' + items.map(function (i) { return i.detailName || i.code; }).join(' + '));
console.log('  门店   ' + (store.storeName || '(未填)') + (store.storeCode ? ' · ' + store.storeCode : ''));
console.log('  口径   价格来自 calculate-price，热量按营养表求和，缺失标未知');
console.log('');

/* ------------------------------ 海报 SVG ------------------------------ */

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function wrap(text, per) {
  const out = [];
  for (let i = 0; i < text.length; i += per) out.push(text.slice(i, i + per));
  return out.slice(0, 2);
}

// 名字越长字越小，保证 2 行内放得下
const nameLen = nm.name.length;
const nameSize = nameLen <= 6 ? 104 : nameLen <= 9 ? 84 : nameLen <= 12 ? 68 : 56;
const perLine = Math.max(4, Math.floor(900 / nameSize));
const nameLines = wrap(nm.name, perLine);
const nameLH = Math.round(nameSize * 1.16);

const nameTop = 300;
const sloganTop = nameTop + nameLines.length * nameLH + 44;
const sloganLines = wrap('「' + nm.slogan + '」', 34);
const cardTop = 812;
const itemsTop = 1050;

const nameTspans = nameLines.map(function (line, i) {
  return '<text x="80" y="' + (nameTop + i * nameLH) + '" font-size="' + nameSize +
    '" font-weight="900" fill="' + C.yellow + '" dominant-baseline="hanging">' + esc(line) + '</text>';
}).join('');

const slogTspans = sloganLines.map(function (line, i) {
  return '<text x="80" y="' + (sloganTop + i * 58) + '" font-size="40" font-weight="500" fill="rgba(255,231,190,.92)" dominant-baseline="hanging">' +
    esc(line) + '</text>';
}).join('');

const itemRows = items.map(function (it, i) {
  const y = itemsTop + i * 50;
  const kcalTxt = (it.kcal === null || it.kcal === undefined) ? '热量未知' : it.kcal + ' kcal';
  const kcalColor = (it.kcal === null || it.kcal === undefined) ? C.red : 'rgba(246,238,227,.34)';
  return '' +
    '<text x="80" y="' + y + '" font-size="26" font-weight="600" fill="rgba(246,238,227,.9)" dominant-baseline="hanging">' +
      esc(it.detailName || it.code) + '</text>' +
    '<text x="' + (100 + String(it.detailName || it.code).length * 26) + '" y="' + (y + 6) +
      '" font-size="17" fill="' + kcalColor + '" dominant-baseline="hanging">' + esc(kcalTxt) + '</text>' +
    '<text x="1000" y="' + y + '" font-size="26" font-weight="700" fill="rgba(255,199,44,.88)" text-anchor="end" dominant-baseline="hanging">¥' +
      (it.subtotalFen / 100).toFixed(2) + '</text>';
}).join('');

const kcalNote = allKnown ? '千卡' : '千卡 · 另有 ' + unknown.length + ' 项未知';

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1440" viewBox="0 0 1080 1440"
     font-family="PingFang SC, Microsoft YaHei, Hiragino Sans GB, Noto Sans CJK SC, sans-serif">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.bg0}"/>
      <stop offset=".42" stop-color="${C.bg1}"/>
      <stop offset="1" stop-color="${C.bg2}"/>
    </linearGradient>
    <radialGradient id="glowY" cx=".87" cy=".08" r=".62">
      <stop offset="0" stop-color="#FFC72C" stop-opacity=".20"/>
      <stop offset="1" stop-color="#FFC72C" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowR" cx=".08" cy=".9" r=".6">
      <stop offset="0" stop-color="#DA291C" stop-opacity=".34"/>
      <stop offset="1" stop-color="#DA291C" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1080" height="1440" fill="url(#bg)"/>
  <rect width="1080" height="1440" fill="url(#glowY)"/>
  <rect width="1080" height="1440" fill="url(#glowR)"/>

  <text x="80" y="116" font-size="30" font-weight="800" fill="${C.yellow}">抽抽想香堡</text>
  <text x="80" y="154" font-size="22" fill="rgba(246,238,227,.46)">CHOUCHOU XIANGXIANGBAO · SKILL EDITION</text>
  <text x="1000" y="116" font-size="22" font-weight="700" fill="rgba(255,199,44,.72)" text-anchor="end">#${L.shortId(L.comboKey(codes))}</text>
  <line x1="80" y1="196" x2="1000" y2="196" stroke="rgba(255,199,44,.22)"/>

  ${nameTspans}
  ${slogTspans}

  <rect x="80" y="${cardTop}" width="920" height="206" rx="28" fill="rgba(255,255,255,.055)" stroke="rgba(255,199,44,.22)" stroke-width="1.5"/>
  <g font-size="21" fill="rgba(246,238,227,.44)" dominant-baseline="hanging">
    <text x="126" y="${cardTop + 36}">总价</text>
    <text x="432" y="${cardTop + 36}">热量</text>
    <text x="739" y="${cardTop + 36}">件数</text>
  </g>
  <g font-size="62" font-weight="900" fill="${C.yellow}" dominant-baseline="hanging">
    <text x="126" y="${cardTop + 68}">¥${yuan}</text>
    <text x="432" y="${cardTop + 68}">${kcal}</text>
    <text x="739" y="${cardTop + 68}">${items.length}</text>
  </g>
  <g font-size="18" fill="rgba(246,238,227,.38)" dominant-baseline="hanging">
    <text x="126" y="${cardTop + 152}">${totalFen} 分</text>
    <text x="432" y="${cardTop + 152}">${esc(kcalNote)}</text>
    <text x="739" y="${cardTop + 152}">份</text>
  </g>
  <g stroke="rgba(255,255,255,.09)">
    <line x1="386" y1="${cardTop + 36}" x2="386" y2="${cardTop + 170}"/>
    <line x1="693" y1="${cardTop + 36}" x2="693" y2="${cardTop + 170}"/>
  </g>

  <line x1="80" y1="${itemsTop - 34}" x2="1000" y2="${itemsTop - 34}" stroke="rgba(255,199,44,.16)"/>
  ${itemRows}

  <line x1="80" y1="1290" x2="1000" y2="1290" stroke="rgba(255,199,44,.18)"/>
  <text x="80" y="1314" font-size="21" font-weight="700" fill="rgba(246,238,227,.72)" dominant-baseline="hanging">${esc(store.storeName || '门店信息以 calculate-price 调用为准')} · 到店自取</text>
  <text x="80" y="1348" font-size="19" fill="rgba(246,238,227,.4)" dominant-baseline="hanging">${esc(input.generatedAt || '')}${store.storeCode ? ' · 门店 ' + esc(store.storeCode) : ''}</text>
  <text x="80" y="1384" font-size="18" font-weight="500" fill="rgba(255,199,44,.62)" dominant-baseline="hanging">DIY 吃法仅供参考，实际供应和价格以门店为准 · 用户 DIY 款，非官方产品名</text>
</svg>
`;

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'poster.svg');
fs.writeFileSync(outFile, svg, 'utf8');
console.log('  ✓ 海报已生成：' + outFile);
console.log('');
