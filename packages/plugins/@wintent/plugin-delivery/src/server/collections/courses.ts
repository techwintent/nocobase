import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@wintent/plugin-delivery',
  dumpRules: { group: 'delivery' },
  uiManageable: true,
  name: 'courses',
  title: '课程',
  createdBy: true,
  updatedBy: true,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'user_id', type: 'bigInt', index: true, comment: '所属教练 user_id' },
    {
      name: 'title',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '课程标题', 'x-component': 'Input' },
    },
    {
      name: 'target_audience',
      type: 'string',
      interface: 'input',
      comment: '目标受众，e.g. "刚转行的健身教练" / "想开始抗阻训练的上班族"',
      uiSchema: { type: 'string', title: '目标受众', 'x-component': 'Input' },
    },
    {
      name: 'description',
      type: 'text',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '课程简介', 'x-component': 'Input.TextArea' },
    },
    {
      name: 'status',
      type: 'string',
      defaultValue: 'drafting',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '状态',
        'x-component': 'Select',
        enum: [
          { value: 'drafting', label: '起草中' },
          { value: 'published', label: '已发布' },
          { value: 'archived', label: '已归档' },
        ],
      },
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
