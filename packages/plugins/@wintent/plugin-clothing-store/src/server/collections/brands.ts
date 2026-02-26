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
  name: 'brands',
  title: '品牌',
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    {
      name: 'name',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '品牌名称', 'x-component': 'Input', required: true },
    },
    {
      name: 'code',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '编码', 'x-component': 'Input' },
    },
    { name: 'logo', type: 'string' },
    { name: 'description', type: 'text' },
    { name: 'status', type: 'string', defaultValue: 'active' },
    { name: 'ext_json', type: 'json', defaultValue: {} },
    { name: 'deletedAt', type: 'date', field: 'deletedAt' },
  ],
});
