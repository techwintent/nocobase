#!/usr/bin/env node
/**
 * 服装店种子数据 - 通过 NocoBase REST API 导入
 * 不依赖 xlsx 导入功能，直接调用 API 创建记录
 *
 * 使用: node seed-api.js [NOCOBASE_URL] [API_TOKEN]
 * 示例: node seed-api.js http://localhost:13000 <TOKEN>
 *
 * 若未提供 TOKEN，会尝试用 admin@wintent.tech / admin123 登录获取
 */

const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = path.dirname(__filename);
const SEED_DIR = path.join(SCRIPT_DIR, 'seed');

const NOCOBASE_URL = process.argv[2] || 'http://localhost:13000';
const API_TOKEN_ARG = process.argv[3];

// 商品名称 -> 款号 映射（用于解析销售单备注）
const PRODUCT_NAME_TO_CODE = {
  春季碎花连衣裙: 'SP001',
  休闲阔腿裤: 'SP002',
  通勤白衬衫: 'SP003',
  牛仔外套: 'SP004',
  针织开衫: 'SP005',
  高腰半身裙: 'SP006',
  棉质T恤: 'SP007',
  雪纺长裙: 'SP008',
  运动休闲裤: 'SP009',
  毛呢大衣: 'SP010',
};

async function api(method, path, body = null) {
  const url = `${NOCOBASE_URL}${path}`;
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Invalid JSON: ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    const err = data?.errors?.[0]?.message || data?.message || text;
    throw new Error(`API ${method} ${path}: ${res.status} - ${err}`);
  }
  return data;
}

async function login() {
  const res = await fetch(`${NOCOBASE_URL}/api/auth:signIn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@wintent.tech',
      password: 'admin123',
    }),
  });
  const data = await res.json();
  if (!data?.data?.token) {
    throw new Error('登录失败，请手动提供 API_TOKEN');
  }
  return data.data.token;
}

async function create(collection, values) {
  const { data } = await api('POST', `/api/${collection}:create`, values);
  return data;
}

async function findOne(collection, filter) {
  const f =
    Object.keys(filter).length === 1
      ? { [Object.keys(filter)[0]]: { $eq: Object.values(filter)[0] } }
      : filter;
  const filterStr = encodeURIComponent(JSON.stringify(f));
  const res = await api(
    'GET',
    `/api/${collection}?filter=${filterStr}&pageSize=1`
  );
  return res?.data?.[0] || null;
}

let token;

async function main() {
  console.log('🚀 服装店种子数据导入');
  console.log('   URL:', NOCOBASE_URL);
  console.log('');

  if (API_TOKEN_ARG) {
    token = API_TOKEN_ARG;
    console.log('   使用提供的 API Token');
  } else {
    console.log('   正在登录获取 Token...');
    token = await login();
    console.log('   ✅ 登录成功');
  }
  console.log('');

  const productsJson = JSON.parse(
    fs.readFileSync(path.join(SEED_DIR, '商品.json'), 'utf8')
  );
  const inventoryJson = JSON.parse(
    fs.readFileSync(path.join(SEED_DIR, '库存.json'), 'utf8')
  );
  const customersJson = JSON.parse(
    fs.readFileSync(path.join(SEED_DIR, '客户.json'), 'utf8')
  );
  const salesJson = JSON.parse(
    fs.readFileSync(path.join(SEED_DIR, '销售单.json'), 'utf8')
  );

  const maps = {
    stores: {},
    suppliers: {},
    brands: {},
    categories: {},
    products: {},
    skus: {},
    customers: {},
    employees: {},
    vipLevels: {},
  };

  // 1. 门店
  const storeNames = [
    ...new Set([
      ...productsJson.map((p) => p.门店),
      ...inventoryJson.map((i) => i.门店),
      ...salesJson.map((s) => s.门店),
    ]),
  ];
  for (const name of storeNames) {
    let rec = await findOne('stores', { name });
    if (!rec) {
      rec = await create('stores', { name, status: 'active' });
    }
    maps.stores[name] = rec;
  }
  console.log(`✅ 门店: ${Object.keys(maps.stores).length}`);

  // 2. 供应商
  const supplierNames = [...new Set(productsJson.map((p) => p.供应商))];
  for (const name of supplierNames) {
    let rec = await findOne('suppliers', { name });
    if (!rec) {
      rec = await create('suppliers', { name });
    }
    maps.suppliers[name] = rec;
  }
  console.log(`✅ 供应商: ${Object.keys(maps.suppliers).length}`);

  // 3. 品牌
  const brandNames = [...new Set(productsJson.map((p) => p.品牌))];
  for (const name of brandNames) {
    let rec = await findOne('brands', { name });
    if (!rec) {
      rec = await create('brands', { name });
    }
    maps.brands[name] = rec;
  }
  console.log(`✅ 品牌: ${Object.keys(maps.brands).length}`);

  // 4. 类别
  const categoryNames = [...new Set(productsJson.map((p) => p.类别))];
  for (const name of categoryNames) {
    let rec = await findOne('categories', { name });
    if (!rec) {
      rec = await create('categories', { name });
    }
    maps.categories[name] = rec;
  }
  console.log(`✅ 类别: ${Object.keys(maps.categories).length}`);

  // 5. 员工
  const employeeNames = [...new Set(salesJson.map((s) => s.经办人))];
  const storeId = maps.stores['总店']?.id; // 用于员工、客户
  for (const name of employeeNames) {
    let rec = await findOne('employees', { name });
    if (!rec) {
      rec = await create('employees', { name, store_id: storeId });
    }
    maps.employees[name] = rec;
  }
  console.log(`✅ 员工: ${Object.keys(maps.employees).length}`);

  // 6. VIP 等级
  const vipNames = [...new Set(customersJson.map((c) => c.VIP等级))];
  for (const name of vipNames) {
    let rec = await findOne('vip_levels', { name });
    if (!rec) {
      rec = await create('vip_levels', { name });
    }
    maps.vipLevels[name] = rec;
  }
  console.log(`✅ VIP等级: ${Object.keys(maps.vipLevels).length}`);

  // 7. 商品
  for (const row of productsJson) {
    let rec = await findOne('products', { spu_code: row.款号 });
    if (!rec) {
      rec = await create('products', {
        spu_code: row.款号,
        name: row.名称,
        status: row.状态 === '在售' ? 'active' : 'inactive',
        cost_price: row.采购价,
        price_1: row.价格1,
        price_2: row.价格2,
        price_3: row.价格3,
        discount: row.产品折扣 ?? 1,
        supplier_id: maps.suppliers[row.供应商]?.id,
        supplier_name: row.供应商,
        brand_id: maps.brands[row.品牌]?.id,
        brand_name: row.品牌,
        category_id: maps.categories[row.类别]?.id,
        category_name: row.类别,
        style: row.风格,
        season: row.季节,
        listed_at: row.上架日期,
      });
    }
    maps.products[row.款号] = rec;
  }
  console.log(`✅ 商品: ${Object.keys(maps.products).length}`);

  // 8. SKU（从库存推导）
  const skuKey = (spu, color, size) => `${spu}|${color}|${size}`;
  const invBySku = {};
  for (const row of inventoryJson) {
    const key = skuKey(row.款号, row.颜色, row.尺码);
    invBySku[key] = row;
  }
  for (const row of inventoryJson) {
    const key = skuKey(row.款号, row.颜色, row.尺码);
    if (maps.skus[key]) continue;
    const product = maps.products[row.款号];
    if (!product) continue;
    const rec = await create('skus', {
      product_id: product.id,
      spu_code: row.款号,
      barcode: row.条码,
      color: row.颜色,
      size: row.尺码,
      cost_price: row.进货价,
      price_1: row.价格1,
    });
    maps.skus[key] = rec;
  }
  console.log(`✅ SKU: ${Object.keys(maps.skus).length}`);

  // 9. 库存
  let invCount = 0;
  for (const row of inventoryJson) {
    const key = skuKey(row.款号, row.颜色, row.尺码);
    const sku = maps.skus[key];
    const product = maps.products[row.款号];
    const store = maps.stores[row.门店];
    if (!sku || !product || !store) continue;
    const existing = await findOne('inventory', {
      store_id: store.id,
      sku_id: sku.id,
    });
    if (existing) continue;
    await create('inventory', {
      store_id: store.id,
      store_name: row.门店,
      product_id: product.id,
      sku_id: sku.id,
      spu_code: row.款号,
      barcode: row.条码,
      product_name: product.name,
      color: row.颜色,
      size: row.尺码,
      quantity: row.库存 ?? 0,
      available_qty: row.库存 ?? 0,
    });
    invCount++;
  }
  console.log(`✅ 库存: ${invCount}`);

  // 10. 客户
  const statusMap = { 活跃: 'active', 沉睡: 'inactive', 流失: 'inactive' };
  for (const row of customersJson) {
    let rec = await findOne('customers', { phone: row.手机 });
    if (!rec) {
      rec = await create('customers', {
        name: row.客户名称,
        phone: row.手机,
        gender: row.性别 || '女',
        birthday: row.生日,
        status: statusMap[row.状态] || 'active',
        vip_level_id: maps.vipLevels[row.VIP等级]?.id,
        vip_level_name: row.VIP等级,
        customer_discount: row.客户折扣,
        total_orders: row.购买次数,
        total_amount: row.购买金额,
        last_order_at: row.上次消费日期,
        last_order_amount: row.上次消费金额,
        days_since_last: row.未消费天数,
        store_id: maps.stores['总店']?.id,
      });
    }
    maps.customers[row.客户名称] = rec;
  }
  console.log(`✅ 客户: ${Object.keys(maps.customers).length}`);

  // 11. 销售单 + 销售明细
  let orderCount = 0;
  let itemCount = 0;
  for (const row of salesJson) {
    const store = maps.stores[row.门店];
    const customer = maps.customers[row.客户];
    const employee = maps.employees[row.经办人];
    if (!store || !customer) continue;

    const orderNo = row.批次 || `SO${Date.now()}-${orderCount}`;
    let order = await findOne('sales_orders', { order_no: orderNo });
    let isNewOrder = false;
    if (!order) {
      try {
        order = await create('sales_orders', {
          order_no: orderNo,
          batch_no: row.批次,
          status: row.状态 === '已完成' ? 'completed' : 'pending',
          store_id: store.id,
          store_name: row.门店,
          customer_id: customer.id,
          customer_name: row.客户,
          customer_phone: customer.phone,
          employee_id: employee?.id,
          employee_name: row.经办人,
          order_date: row.日期,
          actual_qty: row.实销数 ?? row.销售数,
          sale_amount: row.销售额 ?? row.应收,
          receivable: row.应收 ?? row.销售额,
          received: row.实收 ?? row.应收,
          pay_wechat: row.微信 ?? row.实收,
          pay_qrcode: row.扫码收款 ?? row.实收,
          remark: row.备注,
        });
        isNewOrder = true;
        orderCount++;
      } catch (e) {
        if (e.message?.includes('already exists')) {
          order = await findOne('sales_orders', { order_no: orderNo });
        }
        if (!order) throw e;
      }
    }

    // 解析备注创建销售明细（仅新订单，避免重复）
    if (!isNewOrder) continue;

    // 解析备注创建销售明细，如 "春季碎花连衣裙+针织开衫"
    const parts = (row.备注 || '')
      .split(/[+＋]/)
      .map((s) => s.trim())
      .filter(Boolean);
    const productNames = parts.length > 0 ? parts : ['未知'];
    const qtyPerItem = Math.floor((row.实销数 ?? 1) / productNames.length) || 1;

    for (const pname of productNames) {
      const spuCode = PRODUCT_NAME_TO_CODE[pname];
      if (!spuCode) continue;
      const product = maps.products[spuCode];
      if (!product) continue;
      const skuKeys = Object.keys(maps.skus).filter((k) =>
        k.startsWith(spuCode + '|')
      );
      const sku = skuKeys.length > 0 ? maps.skus[skuKeys[0]] : null;
      if (!sku) continue;

      const unitPrice = (row.应收 ?? row.销售额) / (row.实销数 || 1);
      await create('sales_items', {
        order_id: order.id,
        order_no: order.order_no,
        product_id: product.id,
        sku_id: sku.id,
        spu_code: spuCode,
        product_name: product.name,
        color: sku.color,
        size: sku.size,
        quantity: qtyPerItem,
        sell_price: unitPrice,
        amount: qtyPerItem * unitPrice,
      });
      itemCount++;
    }
  }
  console.log(`✅ 销售单: ${orderCount}`);
  console.log(`✅ 销售明细: ${itemCount}`);

  console.log('');
  console.log('========================================');
  console.log('🎉 种子数据导入完成');
  console.log('========================================');
}

main().catch((e) => {
  console.error('❌ 失败:', e.message);
  process.exit(1);
});
