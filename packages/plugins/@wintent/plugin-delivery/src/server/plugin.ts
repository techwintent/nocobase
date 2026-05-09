import { Plugin } from '@nocobase/server';

/**
 * Wintent Delivery Facet Plugin
 *
 * Registers 3 collections for the delivery outward facet:
 *   courses          — course product (title / target_audience / status)
 *   course_modules   — modules within a course; can reverse-link to a source
 *                      reflection via source_reflection_id (sync-from-reflection
 *                      flow uses this to elevate "可沉淀" reflections into
 *                      structured course outline)
 *   course_materials — assets (video / pdf / text) inside a module
 *
 * Plugin is always-loaded (NocoBase pattern). Per-pack facet enable/disable
 * gating happens at flow-runtime / chat-web overlay layer.
 */
export class PluginDeliveryServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {}
}

export default PluginDeliveryServer;
