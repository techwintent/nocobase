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
  name: 'vip_levels',
  title: 'VIP等级',
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    {
      name: 'name',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '等级名称', 'x-component': 'Input', required: true },
    },
    {
      name: 'level',
      type: 'integer',
      defaultValue: 0,
      interface: 'integer',
      uiSchema: { type: 'number', title: '等级序号', 'x-component': 'InputNumber' },
    },
    {
      name: 'discount',
      type: 'decimal',
      precision: 5,
      scale: 2,
      interface: 'input',
      uiSchema: { type: 'string', title: '折扣', 'x-component': 'Input' },
    },
    {
      name: 'price_level',
      type: 'string',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '适用价格',
        'x-component': 'Select',
        enum: [
          { value: 'price_1', label: '价格1' },
          { value: 'price_2', label: '价格2' },
          { value: 'price_3', label: '价格3' },
          { value: 'price_4', label: '价格4' },
          { value: 'price_5', label: '价格5' },
        ],
      },
    },
    { name: 'min_amount', type: 'decimal', precision: 12, scale: 2 },
    { name: 'min_points', type: 'integer' },
    { name: 'benefits', type: 'json', defaultValue: {} },
    { name: 'status', type: 'string', defaultValue: 'active' },
    { name: 'ext_json', type: 'json', defaultValue: {} },
  ],
});
