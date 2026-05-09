import { Plugin } from '@nocobase/server';

/**
 * Wintent Content Marketing Facet Plugin
 *
 * Registers 3 collections supporting the content-marketing outward facet:
 *   content_pieces  — drafted / scheduled / published content artifacts
 *   ip_aspirations  — user's IP positioning (ip_statement / target_audience / unique_angle)
 *   content_topics  — topic ideas linked back to ip_aspirations
 *
 * Plugin is always-loaded (NocoBase pattern); facet enabled/disabled
 * gating happens at flow-runtime / chat-web overlay layer per
 * pack.yaml.spec.outward.facets["content-marketing"]. A pack with this
 * facet disabled simply doesn't write to these tables.
 */
export class PluginContentMarketingServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {}
}

export default PluginContentMarketingServer;
