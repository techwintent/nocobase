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
  name: 'employees',
  title: '员工',
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'uuid', type: 'uuid', unique: true },
    {
      name: 'name',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '姓名', 'x-component': 'Input', required: true },
    },
    {
      name: 'phone',
      type: 'string',
      interface: 'phone',
      uiSchema: { type: 'string', title: '手机', 'x-component': 'Input' },
    },
    {
      name: 'role',
      type: 'string',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '角色',
        'x-component': 'Select',
        enum: [
          { value: '店长', label: '店长' },
          { value: '店员', label: '店员' },
        ],
      },
    },
    {
      name: 'store_id',
      type: 'bigInt',
      index: true,
      interface: 'integer',
      uiSchema: { type: 'number', title: '所属门店', 'x-component': 'InputNumber' },
    },
    { name: 'status', type: 'string', defaultValue: 'active' },
    { name: 'ext_json', type: 'json', defaultValue: {} },
    { name: 'deletedAt', type: 'date', field: 'deletedAt' },
  ],
});
