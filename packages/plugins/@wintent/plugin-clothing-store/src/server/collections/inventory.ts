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
  name: 'inventory',
  title: '库存',
  timestamps: false,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    // 关联
    {
      name: 'store_id',
      type: 'bigInt',
      interface: 'integer',
      uiSchema: { type: 'number', title: '门店ID', 'x-component': 'InputNumber' },
    },
    { name: 'store_name', type: 'string' },
    { name: 'product_id', type: 'bigInt' },
    { name: 'sku_id', type: 'bigInt' },
    // 冗余信息
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
    // 库存数量
    {
      name: 'quantity',
      type: 'integer',
      defaultValue: 0,
      interface: 'integer',
      uiSchema: { type: 'number', title: '当前库存', 'x-component': 'InputNumber' },
    },
    { name: 'available_qty', type: 'integer', defaultValue: 0 },
    { name: 'locked_qty', type: 'integer', defaultValue: 0 },
    // 预警
    { name: 'min_stock', type: 'integer', defaultValue: 0 },
    { name: 'max_stock', type: 'integer' },
    // 成本
    { name: 'avg_cost', type: 'decimal', precision: 12, scale: 2 },
    // 位置
    { name: 'location', type: 'string' },
    // 扩展
    { name: 'ext_json', type: 'json', defaultValue: {} },
    { name: 'updatedAt', type: 'date', field: 'updatedAt' },
  ],
});
