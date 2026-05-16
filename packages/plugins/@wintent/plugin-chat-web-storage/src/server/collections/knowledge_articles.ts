import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@wintent/plugin-chat-web-storage',
  dumpRules: { group: 'chat-web' },
  uiManageable: true,
  name: 'knowledge_articles',
  title: '知识库文章',
  createdBy: true,
  updatedBy: true,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'user_id', type: 'bigInt', index: true, comment: '所属用户 user_id' },
    {
      name: 'title',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '标题', 'x-component': 'Input' },
    },
    {
      name: 'category',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '分类', 'x-component': 'Input' },
    },
    {
      name: 'content',
      type: 'text',
      interface: 'textarea',
      uiSchema: { type: 'string', title: '正文', 'x-component': 'Input.TextArea' },
    },
    {
      name: 'icon',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '图标', 'x-component': 'Input' },
    },
    {
      name: 'industry',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '行业', 'x-component': 'Input' },
    },
    {
      name: 'tags',
      type: 'jsonb',
      interface: 'json',
      comment: 'tags array as jsonb (NocoBase array type 与 PG text[] 兼容性视版本而定，jsonb 更稳)',
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
