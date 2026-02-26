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
  name: 'ai_suggestions',
  title: 'AI建议',
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    {
      name: 'type',
      type: 'string',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '建议类型',
        'x-component': 'Select',
        enum: [
          { value: 'promotion', label: '促销' },
          { value: 'recommendation', label: '推荐' },
          { value: 'recall', label: '回访' },
          { value: 'restock', label: '补货' },
        ],
      },
    },
    {
      name: 'title',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '标题', 'x-component': 'Input' },
    },
    {
      name: 'description',
      type: 'text',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '描述', 'x-component': 'Input.TextArea' },
    },
    { name: 'related_product_id', type: 'bigInt' },
    { name: 'related_customer_id', type: 'bigInt' },
    { name: 'match_count', type: 'integer', defaultValue: 0 },
    {
      name: 'status',
      type: 'string',
      defaultValue: 'pending',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '状态',
        'x-component': 'Select',
        enum: [
          { value: 'pending', label: '待处理' },
          { value: 'accepted', label: '已采纳' },
          { value: 'dismissed', label: '已忽略' },
        ],
      },
    },
    { name: 'priority', type: 'integer', defaultValue: 0 },
  ],
});
