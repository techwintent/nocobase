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
  name: 'products',
  title: '商品',
  createdBy: true,
  updatedBy: true,
  logging: true,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'uuid', type: 'uuid', unique: true },
    // 基础信息
    {
      name: 'spu_code',
      type: 'string',
      unique: true,
      interface: 'input',
      uiSchema: { type: 'string', title: '款号', 'x-component': 'Input', required: true },
    },
    {
      name: 'name',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '名称', 'x-component': 'Input' },
    },
    {
      name: 'status',
      type: 'string',
      defaultValue: 'active',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '状态',
        'x-component': 'Select',
        enum: [
          { value: 'active', label: '在售' },
          { value: 'inactive', label: '停售' },
          { value: 'discontinued', label: '下架' },
        ],
      },
    },
    // 价格体系
    {
      name: 'cost_price',
      type: 'decimal',
      precision: 12,
      scale: 2,
      interface: 'input',
      uiSchema: { type: 'string', title: '采购价', 'x-component': 'Input' },
    },
    {
      name: 'price_1',
      type: 'decimal',
      precision: 12,
      scale: 2,
      interface: 'input',
      uiSchema: { type: 'string', title: '价格1(零售价)', 'x-component': 'Input' },
    },
    {
      name: 'price_2',
      type: 'decimal',
      precision: 12,
      scale: 2,
      interface: 'input',
      uiSchema: { type: 'string', title: '价格2(批发价)', 'x-component': 'Input' },
    },
    {
      name: 'price_3',
      type: 'decimal',
      precision: 12,
      scale: 2,
      interface: 'input',
      uiSchema: { type: 'string', title: '价格3(VIP价)', 'x-component': 'Input' },
    },
    { name: 'price_4', type: 'decimal', precision: 12, scale: 2 },
    { name: 'price_5', type: 'decimal', precision: 12, scale: 2 },
    { name: 'discount', type: 'decimal', precision: 5, scale: 2 },
    // 分类（外键 + 冗余名称）
    { name: 'supplier_id', type: 'bigInt' },
    { name: 'supplier_name', type: 'string' },
    { name: 'brand_id', type: 'bigInt' },
    { name: 'brand_name', type: 'string' },
    { name: 'category_id', type: 'bigInt' },
    { name: 'category_name', type: 'string' },
    // 属性
    {
      name: 'material',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '面料', 'x-component': 'Input' },
    },
    { name: 'lining', type: 'string' },
    { name: 'accessory', type: 'string' },
    {
      name: 'style',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '风格', 'x-component': 'Input' },
    },
    {
      name: 'season',
      type: 'string',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '季节',
        'x-component': 'Select',
        enum: [
          { value: '春', label: '春' },
          { value: '夏', label: '夏' },
          { value: '秋', label: '秋' },
          { value: '冬', label: '冬' },
          { value: '四季', label: '四季' },
        ],
      },
    },
    { name: 'year', type: 'string' },
    // 上架信息
    {
      name: 'listed_at',
      type: 'date',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '上架日期', 'x-component': 'DatePicker' },
    },
    { name: 'sales_cycle', type: 'string' },
    { name: 'is_special', type: 'boolean', defaultValue: false },
    // 合规
    { name: 'exec_standard', type: 'string' },
    { name: 'safety_category', type: 'string' },
    { name: 'quality_grade', type: 'string' },
    { name: 'inspector', type: 'string' },
    { name: 'origin', type: 'string' },
    // 图片
    { name: 'main_image', type: 'string' },
    { name: 'images', type: 'json', defaultValue: [] },
    // 统计
    { name: 'total_stock', type: 'integer', defaultValue: 0 },
    { name: 'total_sold', type: 'integer', defaultValue: 0 },
    // 扩展
    { name: 'unit', type: 'string', defaultValue: '件' },
    { name: 'ext_json', type: 'json', defaultValue: {} },
    { name: 'remark', type: 'text' },
    { name: 'deletedAt', type: 'date', field: 'deletedAt' },
  ],
});
