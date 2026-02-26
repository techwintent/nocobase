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
  name: 'stores',
  title: '门店',
  createdBy: true,
  updatedBy: true,
  logging: true,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'uuid', type: 'uuid', unique: true },
    {
      name: 'name',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '门店名称', 'x-component': 'Input', required: true },
    },
    {
      name: 'code',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '门店编码', 'x-component': 'Input' },
    },
    {
      name: 'type',
      type: 'string',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '门店类型',
        'x-component': 'Select',
        enum: [
          { value: '直营', label: '直营' },
          { value: '加盟', label: '加盟' },
          { value: '批发', label: '批发' },
          { value: '零售', label: '零售' },
        ],
      },
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
          { value: 'active', label: '营业中' },
          { value: 'inactive', label: '暂停' },
          { value: 'closed', label: '关闭' },
        ],
      },
    },
    {
      name: 'phone',
      type: 'string',
      interface: 'phone',
      uiSchema: { type: 'string', title: '电话', 'x-component': 'Input' },
    },
    {
      name: 'address',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '地址', 'x-component': 'Input' },
    },
    { name: 'province', type: 'string' },
    { name: 'city', type: 'string' },
    { name: 'district', type: 'string' },
    {
      name: 'manager_name',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '负责人', 'x-component': 'Input' },
    },
    { name: 'manager_phone', type: 'string' },
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
