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
  name: 'matches',
  title: '搭配',
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    {
      name: 'main_product_id',
      type: 'bigInt',
      index: true,
      interface: 'integer',
      uiSchema: { type: 'number', title: '主商品ID', 'x-component': 'InputNumber' },
    },
    {
      name: 'match_product_id',
      type: 'bigInt',
      index: true,
      interface: 'integer',
      uiSchema: { type: 'number', title: '搭配商品ID', 'x-component': 'InputNumber' },
    },
    {
      name: 'match_rate',
      type: 'decimal',
      precision: 5,
      scale: 2,
      interface: 'input',
      uiSchema: { type: 'string', title: '搭配率', 'x-component': 'Input' },
    },
    {
      name: 'scenario',
      type: 'string',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '场景',
        'x-component': 'Select',
        enum: [
          { value: 'restock', label: '补货' },
          { value: 'sales', label: '销售' },
          { value: 'recommendation', label: '推荐' },
        ],
      },
    },
    { name: 'priority', type: 'integer', defaultValue: 0 },
  ],
});
