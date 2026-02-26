#!/usr/bin/env node
/**
 * 根据 商陆花 表头格式，从 seed/*.json 生成 xlsx 文件
 * 用于数据导入测试
 *
 * 使用: node generate-seed-xlsx.js [输出目录]
 * 默认输出到: docs/clothing-store/scripts/seed-xlsx/
 */

const fs = require('fs');
const path = require('path');

let XLSX;
try {
  XLSX = require('xlsx');
} catch (e) {
  console.error('请先在项目根目录运行: yarn add xlsx (或使用已安装的 xlsx)');
  process.exit(1);
}

const SCRIPT_DIR = path.dirname(__filename);
const SEED_DIR = path.join(SCRIPT_DIR, 'seed');
const OUTPUT_DIR = process.argv[2] || path.join(SCRIPT_DIR, 'seed-xlsx');

// 商陆花表头映射: 文件名 -> 表头顺序
const SHEET_CONFIG = {
  商品: [
    '门店',
    '款号',
    '名称',
    '状态',
    '采购价',
    '价格1',
    '价格2',
    '价格3',
    '产品折扣',
    '供应商',
    '品牌',
    '类别',
    '风格',
    '季节',
    '上架日期',
  ],
  库存: [
    '门店',
    '款号',
    '条码',
    '进货价',
    '颜色',
    '尺码',
    '库存',
    '价格1',
    '价格2',
    '价格3',
  ],
  客户: [
    '客户名称',
    '手机',
    '生日',
    '性别',
    '状态',
    'VIP等级',
    '购买次数',
    '购买金额',
    '上次消费日期',
    '上次消费金额',
    '未消费天数',
    '客户折扣',
  ],
  销售单: [
    '门店',
    '客户',
    '经办人',
    '批次',
    '日期',
    '销售数',
    '退货数',
    '实销数',
    '销售额',
    '退货额',
    '优惠总额',
    '应收',
    '实收',
    '扫码收款',
    '现金',
    '微信',
    '状态',
    '备注',
  ],
};

function generateXlsx() {
  if (!fs.existsSync(SEED_DIR)) {
    console.error('❌ 找不到 seed 目录:', SEED_DIR);
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log('📁 创建输出目录:', OUTPUT_DIR);
  }

  const workbook = XLSX.utils.book_new();

  for (const [sheetName, headers] of Object.entries(SHEET_CONFIG)) {
    const jsonPath = path.join(SEED_DIR, `${sheetName}.json`);
    if (!fs.existsSync(jsonPath)) {
      console.warn('⚠️  跳过（文件不存在）:', jsonPath);
      continue;
    }

    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    const rows = [headers];

    for (const row of data) {
      const orderedRow = headers.map((h) => {
        const val = row[h];
        if (val === undefined) return '';
        if (val instanceof Date) return val.toISOString().slice(0, 10);
        return val;
      });
      rows.push(orderedRow);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, ws, sheetName);
    console.log(`✅ ${sheetName}: ${data.length} 条`);
  }

  const outPath = path.join(OUTPUT_DIR, '商陆花-服装店种子数据.xlsx');
  XLSX.writeFile(workbook, outPath);
  console.log('\n📄 已生成:', outPath);
}

generateXlsx();
