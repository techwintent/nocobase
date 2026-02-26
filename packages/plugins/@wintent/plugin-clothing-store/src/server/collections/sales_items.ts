/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@wintent/plugin-clothing-store',
  dumpRules: { group: 'clothing-store' },
  uiManageable: true,
  name: 'sales_items',
  title: '销售明细',
  timestamps: false,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    // 关联
    {
      name: 'order_id',
      type: 'bigInt',
      interface: 'integer',
      uiSchema: { type: 'number', title: '销售单ID', 'x-component': 'InputNumber' },
    },
    { name: 'order_no', type: 'string' },
    // 商品快照
    { name: 'product_id', type: 'bigInt' },
    { name: 'sku_id', type: 'bigInt' },
    {
      name: 'spu_code',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '款号', 'x-component': 'Input' },
    },
    { name: 'sku_code', type: 'string' },
    {
      name: 'barcode',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '条码', 'x-component': 'Input' },
    },
    {
      name: 'product_name',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '商品名称', 'x-component': 'Input' },
    },
    {
      name: 'color',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '颜色', 'x-component': 'Input' },
    },
    {
      name: 'size',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '尺码', 'x-component': 'Input' },
    },
    // 数量
    {
      name: 'quantity',
      type: 'integer',
      interface: 'integer',
      uiSchema: { type: 'number', title: '数量', 'x-component': 'InputNumber' },
    },
    // 价格快照
    { name: 'cost_price', type: 'decimal', precision: 12, scale: 2 },
    { name: 'original_price', type: 'decimal', precision: 12, scale: 2 },
    {
      name: 'sell_price',
      type: 'decimal',
      precision: 12,
      scale: 2,
      interface: 'input',
      uiSchema: { type: 'string', title: '售价', 'x-component': 'Input' },
    },
    { name: 'discount', type: 'decimal', precision: 5, scale: 2 },
    // 金额
    {
      name: 'amount',
      type: 'decimal',
      precision: 12,
      scale: 2,
      interface: 'input',
      uiSchema: { type: 'string', title: '金额', 'x-component': 'Input' },
    },
    { name: 'discount_amount', type: 'decimal', precision: 12, scale: 2, defaultValue: 0 },
    { name: 'actual_amount', type: 'decimal', precision: 12, scale: 2 },
    // 扩展
    { name: 'ext_json', type: 'json', defaultValue: {} },
    { name: 'remark', type: 'string' },
  ],
});
