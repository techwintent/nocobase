import { Plugin } from '@nocobase/server';

/**
 * Wintent Chat-Web Storage Plugin
 *
 * Owns 4 cross-cutting collections that chat-web reads/writes but didn't
 * previously belong to any wintent plugin:
 *   chat_sessions       — one row per chat conversation
 *   chat_messages       — message rows belonging to a session
 *   chat_segments       — round-grouped segments for memory extraction
 *   knowledge_articles  — user-curated knowledge base articles
 *
 * Field naming intentionally uses snake_case + bigInt user_id to align
 * with the 7 existing wintent facet plugins; chat-web call sites that
 * still use camelCase (userId / sessionId / segmentNumber) will be
 * renamed in I5-H4.
 */
export class PluginChatWebStorageServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {}
}

export default PluginChatWebStorageServer;
