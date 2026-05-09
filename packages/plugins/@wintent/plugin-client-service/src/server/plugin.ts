import { Plugin } from '@nocobase/server';

/**
 * Wintent Client Service Facet Plugin
 *
 * Registers 3 collections for the client-service outward facet:
 *   students       — coached people; 1 student = 1 sheet in the original Excel
 *   sessions       — single training event; FK to students
 *   session_notes  — exercise lines inside a session (weights + reps series)
 *
 * Plugin is always-loaded (NocoBase pattern). Facet enabled/disabled gating
 * happens at flow-runtime / chat-web overlay layer per
 * pack.yaml.spec.outward.facets["client-service"]. Verticals without this
 * facet enabled simply don't write to these tables.
 */
export class PluginClientServiceServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {}
}

export default PluginClientServiceServer;
