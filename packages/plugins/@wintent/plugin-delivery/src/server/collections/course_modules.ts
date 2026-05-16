import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@wintent/plugin-delivery',
  dumpRules: { group: 'delivery' },
  uiManageable: true,
  name: 'course_modules',
  title: '课程模块',
  createdBy: true,
  updatedBy: true,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'user_id', type: 'bigInt', index: true, comment: '所属教练 user_id（冗余便于 query）' },
    { name: 'course_id', type: 'bigInt', index: true, comment: 'FK → courses.id' },
    {
      name: 'sort_order',
      type: 'integer',
      defaultValue: 0,
      interface: 'integer',
      uiSchema: {
        type: 'number',
        title: '模块顺序',
        'x-component': 'InputNumber',
        'x-component-props': { min: 0 },
      },
    },
    {
      name: 'title',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '模块标题', 'x-component': 'Input' },
    },
    {
      name: 'outline',
      type: 'text',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '大纲 / 要点', 'x-component': 'Input.TextArea' },
    },
    {
      name: 'source_reflection_id',
      type: 'bigInt',
      index: true,
      comment: '反向链接 reflections.id — 标记此模块来源于哪条 reflection（如适用）',
      uiSchema: { type: 'number', title: '源 reflection ID', 'x-component': 'InputNumber' },
    },
  ],
});
