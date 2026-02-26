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
  name: 'suppliers',
  title: '供应商',
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'uuid', type: 'uuid', unique: true },
    {
      name: 'name',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '供应商名称', 'x-component': 'Input', required: true },
    },
    {
      name: 'code',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '编码', 'x-component': 'Input' },
    },
    {
      name: 'contact_name',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '联系人', 'x-component': 'Input' },
    },
    {
      name: 'contact_phone',
      type: 'string',
      interface: 'phone',
      uiSchema: { type: 'string', title: '联系电话', 'x-component': 'Input' },
    },
    {
      name: 'address',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '地址', 'x-component': 'Input' },
    },
    { name: 'status', type: 'string', defaultValue: 'active' },
    { name: 'ext_json', type: 'json', defaultValue: {} },
    { name: 'remark', type: 'text' },
    { name: 'deletedAt', type: 'date', field: 'deletedAt' },
  ],
});
