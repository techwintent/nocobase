/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * 话术生成 - 基于客户 + 活动类型（+ 可选商品）的个性化话术模板
 */

import type { Database } from '@nocobase/database';
import type { CampaignType } from './campaign-service';
import { WINTENT_CONFIG } from '../config';

export interface ScriptGenerateParams {
  customerId: number;
  campaignType: CampaignType;
  productId?: number;
  productName?: string;
}

export interface ScriptResult {
  /** 客户偏好与画像说明 */
  analysis: string;
  /** 本次沟通的语气、注意事项与建议 */
  suggestions: string;
  /** 可直接复制发送给客户的参考话术 */
  script: string;
}

const TEMPLATES: Record<CampaignType, string> = {
  clear: '【店铺】{name}您好，我们有一批断码/滞销款正在优惠，{productHint}欢迎到店或微信选款～',
  match: '【店铺】{name}您好，新款已到店，{productHint}欢迎来看～',
  customer: '【店铺】{name}好久不见，我们最近有上新/活动，有空来逛逛呀～',
};

function escape(s: string): string {
  return (s ?? '').trim() || '您';
}

export async function generateScript(db: Database, params: ScriptGenerateParams): Promise<ScriptResult> {
  const { customerId, campaignType, productId, productName: inputProductName } = params;
  const customerRepo = db.getRepository('customers');
  const customer = (await customerRepo.findOne({
    filterByTk: customerId,
    fields: ['name', 'phone_masked', 'vip_level_name', 'days_since_last', 'total_orders', 'total_amount'],
  })) as any;
  const name = escape(customer?.name) || '您';

  // --- 客户历史偏好分析 ---
  const salesOrdersRepo = db.getRepository('sales_orders');
  const salesItemsRepo = db.getRepository('sales_items');
  const productRepo = db.getRepository('products');

  const orders = await salesOrdersRepo.find({
    filter: { customer_id: customerId },
    fields: ['id', 'order_date', 'sale_amount'],
    limit: 200,
  });
  const orderIds = (orders as any[]).map((o) => o.id).filter(Boolean);

  const colorCount = new Map<string, number>();
  const sizeCount = new Map<string, number>();
  const priceSamples: number[] = [];
  const productIdSet = new Set<number>();

  if (orderIds.length > 0) {
    const items = await salesItemsRepo.find({
      filter: { order_id: { $in: orderIds } },
      fields: ['color', 'size', 'sell_price', 'product_id', 'quantity'],
      limit: 2000,
    });
    for (const it of items as any[]) {
      const qty = Number(it.quantity) || 0;
      if (it.color) {
        const key = String(it.color);
        colorCount.set(key, (colorCount.get(key) || 0) + (qty || 0));
      }
      if (it.size) {
        const key = String(it.size);
        sizeCount.set(key, (sizeCount.get(key) || 0) + (qty || 0));
      }
      if (it.sell_price != null) {
        const price = Number(it.sell_price);
        if (!Number.isNaN(price) && price > 0) {
          for (let i = 0; i < (qty || 1); i++) {
            priceSamples.push(price);
          }
        }
      }
      if (it.product_id) {
        productIdSet.add(Number(it.product_id));
      }
    }
  }

  const productMetaMap = new Map<number, { category_name?: string; style?: string }>();
  if (productIdSet.size > 0) {
    const products = await productRepo.find({
      filter: { id: { $in: Array.from(productIdSet) } },
      fields: ['id', 'category_name', 'style'],
      limit: 2000,
    });
    for (const p of products as any[]) {
      const id = Number(p.id);
      if (!id) continue;
      productMetaMap.set(id, {
        category_name: p.category_name ? String(p.category_name) : undefined,
        style: p.style ? String(p.style) : undefined,
      });
    }
  }

  const categoryCount = new Map<string, number>();
  const styleCount = new Map<string, number>();
  if (orderIds.length > 0 && productMetaMap.size > 0) {
    const items = await salesItemsRepo.find({
      filter: { order_id: { $in: orderIds } },
      fields: ['product_id', 'quantity'],
      limit: 2000,
    });
    for (const it of items as any[]) {
      const pid = Number(it.product_id);
      if (!pid) continue;
      const qty = Number(it.quantity) || 0;
      const meta = productMetaMap.get(pid);
      if (!meta) continue;
      if (meta.category_name) {
        const key = meta.category_name;
        categoryCount.set(key, (categoryCount.get(key) || 0) + (qty || 0));
      }
      if (meta.style) {
        const key = meta.style;
        styleCount.set(key, (styleCount.get(key) || 0) + (qty || 0));
      }
    }
  }

  function pickTop(map: Map<string, number>, max: number): string {
    if (!map.size) return '';
    const arr = Array.from(map.entries()).sort((a, b) => (b[1] || 0) - (a[1] || 0));
    return arr
      .slice(0, max)
      .map(([k]) => k)
      .join('/');
  }

  const topSizes = pickTop(sizeCount, 3);
  const topColors = pickTop(colorCount, 3);
  const topCategories = pickTop(categoryCount, 3);
  const topStyles = pickTop(styleCount, 3);

  let avgPriceText = '';
  if (priceSamples.length > 0) {
    const sum = priceSamples.reduce((s, v) => s + v, 0);
    const avg = sum / priceSamples.length;
    avgPriceText = `消费均价约 ¥${avg.toFixed(0)}`;
  }

  const totalOrders = customer?.total_orders != null ? Number(customer.total_orders) || 0 : (orders as any[]).length;
  const totalAmount = customer?.total_amount != null ? Number(customer.total_amount) || 0 : 0;

  const analysisParts: string[] = [];
  if (topStyles) analysisParts.push(`偏好「${topStyles}」风格`);
  if (topCategories) analysisParts.push(`常买品类：${topCategories}`);
  if (topSizes) analysisParts.push(`常购尺码：${topSizes}`);
  if (topColors) analysisParts.push(`偏好颜色：${topColors}`);
  if (avgPriceText) analysisParts.push(avgPriceText);
  analysisParts.push(`累计购买 ${totalOrders} 次，累计消费约 ¥${totalAmount.toFixed(0)}`);
  const analysis =
    analysisParts.length > 0
      ? `该客户${analysisParts.join('，')}。`
      : '该客户历史购买记录较少，可通过本次活动进一步了解其偏好。';

  // --- 沟通建议 ---
  const { SLEEP_DAYS, CHURN_DAYS } = WINTENT_CONFIG;
  const daysSinceLast = customer?.days_since_last != null ? Number(customer.days_since_last) || 0 : undefined;
  let segment: 'active' | 'sleeping' | 'churn' | null = null;
  if (daysSinceLast != null) {
    if (daysSinceLast <= SLEEP_DAYS) segment = 'active';
    else if (daysSinceLast <= CHURN_DAYS) segment = 'sleeping';
    else segment = 'churn';
  }

  const suggestionsParts: string[] = [];
  if (segment === 'active') {
    suggestionsParts.push('建议语气轻松亲切，可直接推荐新品或优惠活动');
  } else if (segment === 'sleeping') {
    suggestionsParts.push('建议语气温和关怀，先简单问候，再自然引出本次活动，避免过于强硬推销');
  } else if (segment === 'churn') {
    suggestionsParts.push('建议语气诚恳，表达对客户的想念和重视，可搭配专属优惠唤回');
  } else {
    suggestionsParts.push('建议先以日常关心或新品资讯破冰，再根据客户反馈逐步介绍活动内容');
  }

  if (customer?.vip_level_name) {
    suggestionsParts.push(`该客户为「${customer.vip_level_name}」，可强调会员专属权益或优先选款服务`);
  }

  if (campaignType === 'clear') {
    suggestionsParts.push('重点突出断码优惠力度和性价比，可结合客户常购尺码与颜色做针对性推荐');
  } else if (campaignType === 'match') {
    suggestionsParts.push('重点突出新品亮点与搭配效果，可结合客户过往风格偏好进行描述');
  } else {
    suggestionsParts.push('以维护关系与关心问候为主，活动信息点到为止即可');
  }

  const suggestions = `${suggestionsParts.join('。')}。`;

  let productHint = '';
  if (inputProductName) {
    productHint = `您可能感兴趣的「${escape(inputProductName)}」有货，`;
  } else if (productId) {
    const productRepo = db.getRepository('products');
    const product = (await productRepo.findOne({
      filterByTk: productId,
      fields: ['name', 'spu_code'],
    })) as any;
    const pName = product?.name || product?.spu_code;
    if (pName) productHint = `「${escape(pName)}」正在促销，`;
  }
  if (campaignType === 'clear' && !productHint) productHint = '您之前常买的款式也有参与，';
  if (campaignType === 'match' && !productHint) productHint = '有您可能喜欢的风格，';

  const template = TEMPLATES[campaignType] || TEMPLATES.customer;
  const script = template.replace(/\{name\}/g, name).replace(/\{productHint\}/g, productHint);

  return {
    analysis,
    suggestions,
    script,
  };
}
