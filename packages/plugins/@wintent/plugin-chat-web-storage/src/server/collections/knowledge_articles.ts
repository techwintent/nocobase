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
      // I7-T1: chat-web filters /api/knowledge_articles with {enabled:true}
      // in multiple call sites (lib/chat/knowledge-prompt.ts, app/(chat)/api/
      // {knowledge,tools,quick-actions}/route.ts). Without this column,
      // Sequelize raised `column knowledge_articles.enabled does not exist`
      // on every page load (100+ errors observed in I6 docker smoke).
      name: 'enabled',
      type: 'boolean',
      defaultValue: true,
      interface: 'checkbox',
      uiSchema: { type: 'boolean', title: '启用', 'x-component': 'Checkbox' },
    },
    // NocoBase auto-adds Sequelize createdAt/updatedAt (camelCase NOT NULL)
    // — see chat_sessions.ts NOTE for context. Mapper reads raw.createdAt.
  ],
});
