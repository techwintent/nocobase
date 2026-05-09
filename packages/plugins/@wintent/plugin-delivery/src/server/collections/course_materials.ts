import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@wintent/plugin-delivery',
  dumpRules: { group: 'delivery' },
  uiManageable: true,
  name: 'course_materials',
  title: '课程素材',
  createdBy: true,
  updatedBy: true,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'user_id', type: 'bigInt', index: true },
    { name: 'module_id', type: 'bigInt', index: true, comment: 'FK → course_modules.id' },
    {
      name: 'type',
      type: 'string',
      defaultValue: 'text',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: '素材类型',
        'x-component': 'Select',
        enum: [
          { value: 'video', label: '视频' },
          { value: 'pdf', label: 'PDF / 文档' },
          { value: 'text', label: '文本 / 笔记' },
          { value: 'image', label: '图片' },
          { value: 'link', label: '外链' },
        ],
      },
    },
    {
      name: 'title',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '标题', 'x-component': 'Input' },
    },
    {
      name: 'url',
      type: 'string',
      interface: 'input',
      comment: 'URL / 文件路径 / 文本所在位置',
      uiSchema: { type: 'string', title: 'URL / 路径', 'x-component': 'Input' },
    },
    {
      name: 'body',
      type: 'text',
      interface: 'textarea',
      comment: '若 type=text，此字段直接存正文',
      uiSchema: { type: 'string', title: '正文（仅 type=text）', 'x-component': 'Input.TextArea' },
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
