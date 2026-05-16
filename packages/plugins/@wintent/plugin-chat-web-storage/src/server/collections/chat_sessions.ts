import { defineCollection } from '@nocobase/database';

export default defineCollection({
  origin: '@wintent/plugin-chat-web-storage',
  dumpRules: { group: 'chat-web' },
  uiManageable: true,
  name: 'chat_sessions',
  title: '聊天会话',
  createdBy: true,
  updatedBy: true,
  fields: [
    { name: 'id', type: 'bigInt', autoIncrement: true, primaryKey: true, allowNull: false },
    { name: 'user_id', type: 'bigInt', index: true, comment: '所属用户 user_id' },
    {
      name: 'title',
      type: 'string',
      interface: 'input',
      uiSchema: { type: 'string', title: '会话标题', 'x-component': 'Input' },
    },
    { name: 'current_segment_id', type: 'bigInt', comment: '指向当前 open segment（冗余便于 query）' },
    { name: 'total_segments', type: 'integer', defaultValue: 0 },
    { name: 'total_messages', type: 'integer', defaultValue: 0 },
    // NOTE on timestamps: NocoBase's collection model auto-adds Sequelize
    // timestamp columns `createdAt` / `updatedAt` (camelCase, NOT NULL) by
    // default. Defining explicit snake_case `created_at` / `updated_at`
    // creates a duplicate column whose NOT NULL camelCase sibling fails on
    // INSERT (verified 2026-05-16 round-trip smoke; same latent bug exists
    // in all 7 pre-existing wintent plugins — see I5 Issue Plugin-Timestamp-Camelcase).
    // For now we only fix this collection by relying on the default
    // camelCase timestamps; mapper reads `raw.createdAt` for these fields.
  ],
});
