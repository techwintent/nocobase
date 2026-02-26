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
  name: 'skus',
  title: 'SKU',
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'uuid', type: 'uuid', unique: true },
    // 关联
    {
      name: 'product_id',
      type: 'bigInt',
      interface: 'integer',
      uiSchema: { type: 'number', title: '商品ID', 'x-component': 'InputNumber' },
    },
    {
      name: 'spu_code',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '款号', 'x-component': 'Input' },
    },
    // SKU 属性
    {
      name: 'sku_code',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: 'SKU编码', 'x-component': 'Input' },
    },
    {
      name: 'barcode',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '条码', 'x-component': 'Input' },
    },
    {
      name: 'color',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '颜色', 'x-component': 'Input' },
    },
    { name: 'color_code', type: 'string' },
    {
      name: 'size',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '尺码', 'x-component': 'Input' },
    },
    // 价格（可覆盖商品价格）
    {
      name: 'cost_price',
      type: 'decimal',
      precision: 12,
      scale: 2,
      interface: 'input',
      uiSchema: { type: 'string', title: '进货价', 'x-component': 'Input' },
    },
    { name: 'price_1', type: 'decimal', precision: 12, scale: 2 },
    { name: 'price_2', type: 'decimal', precision: 12, scale: 2 },
    { name: 'price_3', type: 'decimal', precision: 12, scale: 2 },
    { name: 'price_4', type: 'decimal', precision: 12, scale: 2 },
    { name: 'price_5', type: 'decimal', precision: 12, scale: 2 },
    // 状态
    { name: 'status', type: 'string', defaultValue: 'active' },
    // 图片
    { name: 'image', type: 'string' },
    // 扩展
    { name: 'ext_json', type: 'json', defaultValue: {} },
    { name: 'deletedAt', type: 'date', field: 'deletedAt' },
  ],
});
