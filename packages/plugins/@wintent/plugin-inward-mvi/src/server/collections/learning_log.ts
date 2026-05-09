import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@wintent/plugin-inward-mvi',
  dumpRules: { group: 'inward-mvi' },
  uiManageable: true,
  name: 'learning_log',
  title: '学习记录',
  createdBy: true,
  updatedBy: true,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'user_id', type: 'bigInt', index: true },
    {
      name: 'source',
      type: 'string',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '来源',
        'x-component': 'Select',
        enum: [
          { value: 'book', label: '书' },
          { value: 'video', label: '视频' },
          { value: 'course', label: '上课' },
          { value: 'practice', label: '实践' },
          { value: 'other', label: '其他' },
        ],
      },
    },
    {
      name: 'topic',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '主题', 'x-component': 'Input' },
    },
    {
      name: 'key_insight',
      type: 'text',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '关键洞察', 'x-component': 'Input.TextArea' },
    },
    {
      name: 'applied_to',
      type: 'text',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '应用场景', 'x-component': 'Input.TextArea' },
    },
    {
      name: 'created_at',
      type: 'date',
      interface: 'createdAt',
      uiSchema: { type: 'datetime', title: '创建时间', 'x-component': 'DatePicker' },
    },
  ],
});
