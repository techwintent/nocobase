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
  name: 'customers',
  title: '客户',
  createdBy: true,
  updatedBy: true,
  logging: true,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'uuid', type: 'uuid', unique: true },
    // 基础信息
    {
      name: 'name',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '客户名称', 'x-component': 'Input' },
    },
    {
      name: 'phone',
      type: 'string',
      unique: true,
      interface: 'phone',
      uiSchema: { type: 'string', title: '手机', 'x-component': 'Input' },
    },
    { name: 'phone_masked', type: 'string' },
    {
      name: 'gender',
      type: 'string',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '性别',
        'x-component': 'Select',
        enum: [
          { value: '男', label: '男' },
          { value: '女', label: '女' },
          { value: '未知', label: '未知' },
        ],
      },
    },
    {
      name: 'birthday',
      type: 'date',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '生日', 'x-component': 'DatePicker' },
    },
    // 状态
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
          { value: 'active', label: '活跃' },
          { value: 'inactive', label: '沉睡' },
          { value: 'blacklist', label: '黑名单' },
        ],
      },
    },
    // 会员信息
    { name: 'vip_level_id', type: 'bigInt', index: true },
    { name: 'vip_level_name', type: 'string' },
    { name: 'paid_member_level', type: 'string' },
    { name: 'member_expire_at', type: 'date' },
    { name: 'customer_discount', type: 'decimal', precision: 5, scale: 2 },
    { name: 'price_level', type: 'string' },
    // 储值
    { name: 'balance', type: 'decimal', precision: 12, scale: 2, defaultValue: 0 },
    { name: 'principal_balance', type: 'decimal', precision: 12, scale: 2, defaultValue: 0 },
    { name: 'gift_balance', type: 'decimal', precision: 12, scale: 2, defaultValue: 0 },
    { name: 'credit_balance', type: 'decimal', precision: 12, scale: 2, defaultValue: 0 },
    { name: 'points', type: 'integer', defaultValue: 0 },
    // 消费统计
    {
      name: 'total_orders',
      type: 'integer',
      defaultValue: 0,
      interface: 'integer',
      uiSchema: { type: 'number', title: '购买次数', 'x-component': 'InputNumber' },
    },
    {
      name: 'total_amount',
      type: 'decimal',
      precision: 14,
      scale: 2,
      defaultValue: 0,
      interface: 'input',
      uiSchema: { type: 'string', title: '购买金额', 'x-component': 'Input' },
    },
    { name: 'last_order_at', type: 'date' },
    { name: 'last_order_amount', type: 'decimal', precision: 12, scale: 2 },
    { name: 'days_since_last', type: 'integer' },
    { name: 'avg_order_amount', type: 'decimal', precision: 12, scale: 2 },
    // 归属
    { name: 'store_id', type: 'bigInt', index: true },
    { name: 'employee_id', type: 'bigInt', index: true },
    { name: 'employee_name', type: 'string' },
    // 地址
    { name: 'province', type: 'string' },
    { name: 'city', type: 'string' },
    { name: 'district', type: 'string' },
    { name: 'address', type: 'string' },
    // 标签和来源
    { name: 'tags', type: 'json', defaultValue: [] },
    { name: 'source', type: 'string' },
    { name: 'source_detail', type: 'string' },
    // 扩展
    { name: 'ext_json', type: 'json', defaultValue: {} },
    { name: 'remark', type: 'text' },
    { name: 'deletedAt', type: 'date', field: 'deletedAt' },
  ],
});
