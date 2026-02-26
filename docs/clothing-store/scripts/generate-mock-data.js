#!/usr/bin/env node
/**
 * 按日期生成模拟数据 xlsx 文件，用于测试导入和 diff 功能
 * 在 docs/clothing-store/example/ 下按日期创建子目录，每个目录包含 4 个 xlsx 文件
 * 每次运行基于随机种子产生不同数据：既有对已有记录的更新，也有新增记录
 *
 * 使用: node generate-mock-data.js [天数] [起始日期] [随机种子]
 * 示例: node generate-mock-data.js 5 2025-02-12
 *       node generate-mock-data.js 5 2025-02-12 12345  # 固定种子，可复现
 * 默认: 5 天, 起始 2025-02-12, 种子=当前时间戳
 */

const fs = require('fs');
const path = require('path');

let XLSX;
try {
  XLSX = require('xlsx');
} catch (e) {
  console.error('请先在项目根目录运行: yarn add xlsx');
  process.exit(1);
}

const SCRIPT_DIR = path.dirname(__filename);
const SEED_DIR = path.join(SCRIPT_DIR, 'seed');
const EXAMPLE_DIR = path.join(path.dirname(SCRIPT_DIR), 'example');

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

// 新增商品候选（用于随机生成）
const NEW_PRODUCT_TEMPLATES = [
  {
    名称: '新款针织衫',
    类别: '上装',
    风格: '休闲',
    季节: '春',
    采购价: 68,
    价格1: 168,
    供应商: '广州女装厂',
  },
  {
    名称: '时尚风衣',
    类别: '外套',
    风格: '通勤',
    季节: '秋',
    采购价: 150,
    价格1: 358,
    供应商: '杭州服饰',
  },
  {
    名称: '百搭卫衣',
    类别: '上装',
    风格: '休闲',
    季节: '秋',
    采购价: 55,
    价格1: 138,
    供应商: '广州女装厂',
  },
  {
    名称: '蕾丝上衣',
    类别: '上装',
    风格: '甜美',
    季节: '夏',
    采购价: 48,
    价格1: 128,
    供应商: '杭州服饰',
  },
  {
    名称: '韩版短裙',
    类别: '半身裙',
    风格: '甜美',
    季节: '夏',
    采购价: 52,
    价格1: 148,
    供应商: '广州女装厂',
  },
  {
    名称: '加绒打底裤',
    类别: '裤装',
    风格: '休闲',
    季节: '冬',
    采购价: 35,
    价格1: 98,
    供应商: '杭州服饰',
  },
];

const PRODUCT_NAMES_FOR_SALES = [
  '春季碎花连衣裙',
  '休闲阔腿裤',
  '通勤白衬衫',
  '牛仔外套',
  '针织开衫',
  '高腰半身裙',
  '棉质T恤',
  '雪纺长裙',
  '运动休闲裤',
  '毛呢大衣',
];

const VIP_LEVELS = ['普通', '银卡', '金卡', '钻石'];
const COLORS = ['白色', '黑色', '红色', '蓝色', '灰色', '粉色', '米色', '驼色'];
const SIZES = ['S', 'M', 'L', 'XL'];

// 简易 PRNG (mulberry32)，可复现
function createRng(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function loadSeed() {
  const files = ['商品', '库存', '客户', '销售单'];
  const data = {};
  for (const f of files) {
    const p = path.join(SEED_DIR, `${f}.json`);
    data[f] = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : [];
  }
  return data;
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function pickRand(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function pickRandN(rng, arr, n) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function generateDayData(seed, dayIndex, baseDate, rng) {
  const date = addDays(baseDate, dayIndex);
  const data = { 商品: [], 库存: [], 客户: [], 销售单: [] };

  if (dayIndex === 0) {
    data.商品 = JSON.parse(JSON.stringify(seed.商品));
    data.库存 = JSON.parse(JSON.stringify(seed.库存));
    data.客户 = JSON.parse(JSON.stringify(seed.客户));
    data.销售单 = JSON.parse(JSON.stringify(seed.销售单));
    return { date, data };
  }

  const lastSpuNum = Math.max(
    ...seed.商品.map(
      (r) => parseInt((r.款号 || '').replace('SP', ''), 10) || 0
    ),
    10
  );
  let nextSpu = lastSpuNum + 1;

  // ---- 商品：深拷贝 + 随机更新 + 随机新增 ----
  data.商品 = JSON.parse(JSON.stringify(seed.商品));
  const updateProductCount = randInt(rng, 2, 5);
  const toUpdateProducts = pickRandN(rng, data.商品, updateProductCount);
  for (const p of toUpdateProducts) {
    p.价格1 = Math.max(50, (p.价格1 || 100) + randInt(rng, -15, 25));
    p.价格2 = Math.max(40, (p.价格2 || 80) + randInt(rng, -10, 15));
    p.价格3 = Math.max(30, (p.价格3 || 70) + randInt(rng, -8, 12));
    p.采购价 = Math.max(20, (p.采购价 || 50) + randInt(rng, -5, 10));
  }
  const insertProductCount = randInt(rng, 0, 2);
  for (let i = 0; i < insertProductCount; i++) {
    const tpl = pickRand(rng, NEW_PRODUCT_TEMPLATES);
    const spuCode = `SP${String(nextSpu++).padStart(3, '0')}`;
    data.商品.push({
      门店: '总店',
      款号: spuCode,
      名称: tpl.名称 + (insertProductCount > 1 ? String(i + 1) : ''),
      状态: '在售',
      采购价: tpl.采购价 + randInt(rng, -5, 10),
      价格1: tpl.价格1 + randInt(rng, -20, 30),
      价格2: Math.floor(tpl.价格1 * 0.85) + randInt(rng, -10, 10),
      价格3: Math.floor(tpl.价格1 * 0.75) + randInt(rng, -10, 10),
      产品折扣: 1,
      供应商: tpl.供应商,
      品牌: '自有',
      类别: tpl.类别,
      风格: tpl.风格,
      季节: tpl.季节,
      上架日期: addDays(baseDate, dayIndex - 1),
    });
  }

  // ---- 库存：深拷贝 + 随机更新 + 为新增商品补 SKU ----
  data.库存 = JSON.parse(JSON.stringify(seed.库存));
  const updateInvCount = randInt(rng, 3, 8);
  const toUpdateInv = pickRandN(rng, data.库存, updateInvCount);
  for (const inv of toUpdateInv) {
    inv.库存 = Math.max(0, (inv.库存 || 0) + randInt(rng, -3, 10));
    inv.进货价 = Math.max(10, (inv.进货价 || 50) + randInt(rng, -5, 8));
    inv.价格1 = Math.max(50, (inv.价格1 || 100) + randInt(rng, -10, 15));
  }
  for (let i = lastSpuNum + 1; i < nextSpu; i++) {
    const spuCode = `SP${String(i).padStart(3, '0')}`;
    const prod = data.商品.find((p) => p.款号 === spuCode);
    if (!prod) continue;
    const color = pickRand(rng, COLORS);
    const size = pickRand(rng, SIZES);
    const cost = prod.采购价 || 50;
    const price = prod.价格1 || 100;
    data.库存.push({
      门店: '总店',
      款号: spuCode,
      条码: `${spuCode}-${color.slice(0, 3).toUpperCase()}-${size}`,
      进货价: cost,
      颜色: color,
      尺码: size,
      库存: randInt(rng, 2, 15),
      价格1: price,
      价格2: Math.floor(price * 0.9),
      价格3: Math.floor(price * 0.8),
    });
  }

  // ---- 客户：深拷贝 + 随机更新 + 随机新增 ----
  data.客户 = JSON.parse(JSON.stringify(seed.客户));
  const updateCustCount = randInt(rng, 2, 5);
  const toUpdateCust = pickRandN(rng, data.客户, updateCustCount);
  for (const c of toUpdateCust) {
    c.购买次数 = Math.max(0, (c.购买次数 || 0) + randInt(rng, 0, 3));
    c.购买金额 = Math.max(0, (c.购买金额 || 0) + randInt(rng, 0, 500));
    c.未消费天数 = Math.max(0, (c.未消费天数 || 0) + randInt(rng, -5, 10));
    if (rng() < 0.3) c.VIP等级 = pickRand(rng, VIP_LEVELS);
  }
  const insertCustCount = randInt(rng, 0, 2);
  const surnames = ['赵', '钱', '孙', '李', '周', '吴', '郑', '王', '冯', '陈'];
  const names = ['女士', '小姐', '先生', '姐', '妹'];
  for (let i = 0; i < insertCustCount; i++) {
    const phone = `1${randInt(rng, 3000000000, 3999999999)}`;
    const name =
      pickRand(rng, surnames) +
      pickRand(rng, names) +
      (insertCustCount > 1 ? i : '');
    const buyDate = addDays(baseDate, dayIndex - randInt(rng, 0, 3));
    data.客户.push({
      客户名称: name,
      手机: phone,
      生日: `${1985 + randInt(rng, 0, 25)}-${String(
        randInt(rng, 1, 12)
      ).padStart(2, '0')}-${String(randInt(rng, 1, 28)).padStart(2, '0')}`,
      性别: '女',
      状态: '活跃',
      VIP等级: pickRand(rng, VIP_LEVELS),
      购买次数: randInt(rng, 0, 5),
      购买金额: randInt(rng, 0, 800),
      上次消费日期: rng() < 0.6 ? buyDate : '',
      上次消费金额: randInt(rng, 0, 300),
      未消费天数: randInt(rng, 0, 90),
      客户折扣: rng() < 0.5 ? 1 : [95, 9, 85, 8][randInt(rng, 0, 3)],
    });
  }

  // ---- 销售单：深拷贝 + 随机新增 ----
  data.销售单 = JSON.parse(JSON.stringify(seed.销售单));
  const insertSaleCount = randInt(rng, 1, 4);
  const allCustomers = data.客户.map((c) => c.客户名称);
  const batchBase = date.replace(/-/g, '');
  for (let i = 0; i < insertSaleCount; i++) {
    const cust = pickRand(rng, allCustomers);
    const prodNames = pickRandN(
      rng,
      PRODUCT_NAMES_FOR_SALES,
      randInt(rng, 1, 3)
    );
    const remark = prodNames.join('+');
    const qty = randInt(rng, 1, 3);
    const unitPrice = randInt(rng, 80, 300);
    const amount = qty * unitPrice;
    data.销售单.push({
      门店: '总店',
      客户: cust,
      经办人: '店员小王',
      批次: `B${batchBase}${String(insertSaleCount + i).padStart(3, '0')}`,
      日期: date,
      销售数: qty,
      退货数: 0,
      实销数: qty,
      销售额: amount,
      退货额: 0,
      优惠总额: 0,
      应收: amount,
      实收: amount,
      扫码收款: amount,
      现金: 0,
      微信: amount,
      状态: '已完成',
      备注: remark,
    });
  }

  return { date, data };
}

function writeXlsx(dir, type, rows) {
  const headers = SHEET_CONFIG[type];
  const data = [headers];
  for (const row of rows) {
    data.push(
      headers.map((h) => {
        const v = row[h];
        if (v === undefined) return '';
        if (v instanceof Date) return v.toISOString().slice(0, 10);
        return v;
      })
    );
  }
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, type);
  const outPath = path.join(dir, `${type}.xlsx`);
  XLSX.writeFile(wb, outPath);
}

function main() {
  const days = parseInt(process.argv[2] || '5', 10);
  const baseDate = process.argv[3] || '2025-02-12';
  const seed = process.argv[4] ? parseInt(process.argv[4], 10) : Date.now();
  const rng = createRng(seed);

  if (!fs.existsSync(EXAMPLE_DIR)) {
    fs.mkdirSync(EXAMPLE_DIR, { recursive: true });
  }

  const seedData = loadSeed();
  console.log('📁 生成模拟数据（随机）');
  console.log('   天数:', days);
  console.log('   起始日期:', baseDate);
  console.log('   随机种子:', seed);
  console.log('');

  for (let i = 0; i < days; i++) {
    const { date, data } = generateDayData(seedData, i, baseDate, rng);
    const dir = path.join(EXAMPLE_DIR, date);
    fs.mkdirSync(dir, { recursive: true });
    for (const [type, rows] of Object.entries(data)) {
      writeXlsx(dir, type, rows);
    }
    console.log(
      `✅ ${date}: 商品${data.商品.length} 库存${data.库存.length} 客户${data.客户.length} 销售单${data.销售单.length}`
    );
  }

  console.log('');
  console.log('📄 输出目录:', EXAMPLE_DIR);
}

main();
