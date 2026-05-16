import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@wintent/plugin-inward-mvi',
  dumpRules: { group: 'inward-mvi' },
  uiManageable: true,
  name: 'state_monitor',
  title: '状态监测',
  createdBy: true,
  updatedBy: true,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'user_id', type: 'bigInt', index: true },
    {
      name: 'energy_level',
      type: 'integer',
      interface: 'integer',
      uiSchema: {
        type: 'number',
        title: '能量等级 (1-10)',
        'x-component': 'InputNumber',
        'x-component-props': { min: 1, max: 10 },
      },
    },
    {
      name: 'focus_level',
      type: 'integer',
      interface: 'integer',
      uiSchema: {
        type: 'number',
        title: '专注等级 (1-10)',
        'x-component': 'InputNumber',
        'x-component-props': { min: 1, max: 10 },
      },
    },
    {
      name: 'mood',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '心情', 'x-component': 'Input' },
    },
    {
      name: 'sampled_at',
      type: 'date',
      interface: 'datetime',
      uiSchema: { type: 'datetime', title: '采样时间', 'x-component': 'DatePicker' },
    },
  ],
});
