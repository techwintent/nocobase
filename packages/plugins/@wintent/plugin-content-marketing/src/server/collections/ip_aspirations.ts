import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@wintent/plugin-content-marketing',
  dumpRules: { group: 'content-marketing' },
  uiManageable: true,
  name: 'ip_aspirations',
  title: 'IP 定位',
  createdBy: true,
  updatedBy: true,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'user_id', type: 'bigInt', index: true },
    {
      name: 'ip_statement',
      type: 'text',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: 'IP 定位陈述',
        'x-component': 'Input.TextArea',
      },
    },
    {
      name: 'target_audience',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '目标受众', 'x-component': 'Input' },
    },
    {
      name: 'unique_angle',
      type: 'text',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: '独特角度',
        'x-component': 'Input.TextArea',
      },
    },
    {
      name: 'stage',
      type: 'string',
      defaultValue: 'bootstrap',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '阶段',
        'x-component': 'Select',
        enum: [
          { value: 'bootstrap', label: 'Bootstrap (0 起步)' },
          { value: 'active', label: 'Active (持续输出)' },
          { value: 'mature', label: 'Mature (已立住)' },
        ],
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
    {
      name: 'updated_at',
      type: 'date',
      interface: 'updatedAt',
      uiSchema: { type: 'datetime', title: '更新时间', 'x-component': 'DatePicker' },
    },
  ],
});
