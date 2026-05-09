import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@wintent/plugin-inward-mvi',
  dumpRules: { group: 'inward-mvi' },
  uiManageable: true,
  name: 'soul_profile',
  title: 'AI 对话风格档案',
  createdBy: true,
  updatedBy: true,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'user_id', type: 'bigInt', index: true, unique: true },
    {
      name: 'coaching_style',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '教练风格 slug', 'x-component': 'Input' },
    },
    {
      name: 'proactive_cadence',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '主动节奏 slug', 'x-component': 'Input' },
    },
    {
      name: 'flow_moments',
      type: 'json',
      interface: 'json',
      uiSchema: { type: 'object', title: '流动时刻', 'x-component': 'Input.JSON' },
    },
    {
      name: 'boundary_rules',
      type: 'json',
      interface: 'json',
      uiSchema: { type: 'object', title: '边界规则', 'x-component': 'Input.JSON' },
    },
    {
      name: 'created_at',
      type: 'date',
      interface: 'createdAt',
      uiSchema: { type: 'datetime', title: '创建时间', 'x-component': 'DatePicker' },
    },
    {
      name: 'updated_at',
      type: 'date',
      interface: 'updatedAt',
      uiSchema: { type: 'datetime', title: '更新时间', 'x-component': 'DatePicker' },
    },
  ],
});
