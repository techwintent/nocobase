import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@wintent/plugin-inward-mvi',
  dumpRules: { group: 'inward-mvi' },
  uiManageable: true,
  name: 'aspirations',
  title: '长期愿景',
  createdBy: true,
  updatedBy: true,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'user_id', type: 'bigInt', index: true },
    {
      name: 'horizon',
      type: 'string',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '时间维度',
        'x-component': 'Select',
        enum: [
          { value: '5y', label: '5 年' },
          { value: '1y', label: '1 年' },
          { value: 'quarter', label: '季度' },
        ],
      },
    },
    {
      name: 'statement',
      type: 'text',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '愿景描述', 'x-component': 'Input.TextArea' },
    },
    {
      name: 'progress_percent',
      type: 'integer',
      defaultValue: 0,
      interface: 'integer',
      uiSchema: {
        type: 'number',
        title: '进度 (%)',
        'x-component': 'InputNumber',
        'x-component-props': { min: 0, max: 100 },
      },
    },
    {
      name: 'last_reviewed_at',
      type: 'date',
      interface: 'datetime',
      uiSchema: { type: 'datetime', title: '上次复盘', 'x-component': 'DatePicker' },
    },
    {
      name: 'created_at',
      type: 'date',
      interface: 'createdAt',
      uiSchema: { type: 'datetime', title: '创建时间', 'x-component': 'DatePicker' },
    },
  ],
});
