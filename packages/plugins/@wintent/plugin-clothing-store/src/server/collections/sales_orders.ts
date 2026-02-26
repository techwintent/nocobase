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
  name: 'sales_orders',
  title: '销售单',
  createdBy: true,
  updatedBy: true,
  logging: true,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'uuid', type: 'uuid', unique: true },
    // 单据信息
    {
      name: 'order_no',
      type: 'string',
      unique: true,
      interface: 'input',
      uiSchema: { type: 'string', title: '单据编号', 'x-component': 'Input', required: true },
    },
    {
      name: 'batch_no',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '批次号', 'x-component': 'Input' },
    },
    {
      name: 'order_type',
      type: 'string',
      defaultValue: 'sale',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '单据类型',
        'x-component': 'Select',
        enum: [
          { value: 'sale', label: '销售' },
          { value: 'return', label: '退货' },
          { value: 'exchange', label: '换货' },
        ],
      },
    },
    {
      name: 'status',
      type: 'string',
      defaultValue: 'completed',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '状态',
        'x-component': 'Select',
        enum: [
          { value: 'pending', label: '待完成' },
          { value: 'completed', label: '已完成' },
          { value: 'cancelled', label: '已取消' },
          { value: 'refunded', label: '已退款' },
        ],
      },
    },
    // 关联（外键 + 冗余）
    { name: 'store_id', type: 'bigInt' },
    { name: 'store_name', type: 'string' },
    { name: 'customer_id', type: 'bigInt' },
    { name: 'customer_name', type: 'string' },
    { name: 'customer_phone', type: 'string' },
    { name: 'employee_id', type: 'bigInt' },
    { name: 'employee_name', type: 'string' },
    // 时间
    {
      name: 'order_date',
      type: 'date',
      interface: 'datetime',
      uiSchema: { type: 'string', title: '销售日期', 'x-component': 'DatePicker' },
    },
    { name: 'order_time', type: 'date' },
    // 数量
    { name: 'sale_qty', type: 'integer', defaultValue: 0 },
    { name: 'return_qty', type: 'integer', defaultValue: 0 },
    {
      name: 'actual_qty',
      type: 'integer',
      defaultValue: 0,
      interface: 'integer',
      uiSchema: { type: 'number', title: '实销数', 'x-component': 'InputNumber' },
    },
    // 金额
    {
      name: 'sale_amount',
      type: 'decimal',
      precision: 12,
      scale: 2,
      defaultValue: 0,
      interface: 'input',
      uiSchema: { type: 'string', title: '销售额', 'x-component': 'Input' },
    },
    { name: 'return_amount', type: 'decimal', precision: 12, scale: 2, defaultValue: 0 },
    { name: 'discount_amount', type: 'decimal', precision: 12, scale: 2, defaultValue: 0 },
    { name: 'other_fee', type: 'decimal', precision: 12, scale: 2, defaultValue: 0 },
    {
      name: 'receivable',
      type: 'decimal',
      precision: 12,
      scale: 2,
      defaultValue: 0,
      interface: 'input',
      uiSchema: { type: 'string', title: '应收', 'x-component': 'Input' },
    },
    {
      name: 'received',
      type: 'decimal',
      precision: 12,
      scale: 2,
      defaultValue: 0,
      interface: 'input',
      uiSchema: { type: 'string', title: '实收', 'x-component': 'Input' },
    },
    // 抵扣
    { name: 'coupon_deduct', type: 'decimal', precision: 12, scale: 2, defaultValue: 0 },
    { name: 'points_deduct', type: 'decimal', precision: 12, scale: 2, defaultValue: 0 },
    // 支付方式明细
    { name: 'pay_principal', type: 'decimal', precision: 12, scale: 2, defaultValue: 0 },
    { name: 'pay_gift', type: 'decimal', precision: 12, scale: 2, defaultValue: 0 },
    { name: 'pay_qrcode', type: 'decimal', precision: 12, scale: 2, defaultValue: 0 },
    { name: 'pay_cash', type: 'decimal', precision: 12, scale: 2, defaultValue: 0 },
    { name: 'pay_bank', type: 'decimal', precision: 12, scale: 2, defaultValue: 0 },
    { name: 'pay_alipay', type: 'decimal', precision: 12, scale: 2, defaultValue: 0 },
    { name: 'pay_wechat', type: 'decimal', precision: 12, scale: 2, defaultValue: 0 },
    { name: 'pay_other', type: 'decimal', precision: 12, scale: 2, defaultValue: 0 },
    // 支付汇总
    { name: 'payments', type: 'json', defaultValue: [] },
    // 扩展
    { name: 'ext_json', type: 'json', defaultValue: {} },
    {
      name: 'remark',
      type: 'text',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '备注', 'x-component': 'Input.TextArea' },
    },
    { name: 'deletedAt', type: 'date', field: 'deletedAt' },
  ],
});
