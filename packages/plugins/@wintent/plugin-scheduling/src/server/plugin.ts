import { Plugin } from '@nocobase/server';

/**
 * Wintent Scheduling Facet Plugin
 *
 * Registers 2 collections for the scheduling outward facet:
 *   schedule_slots     — planned/confirmed/cancelled training slots
 *   schedule_conflicts — recorded overlap incidents (slot_id_1 + slot_id_2)
 *
 * Plugin is always-loaded (NocoBase pattern). The conflict-check flow
 * (core-overlays/flows/scheduling/) handles overlap detection at slot
 * creation time, writing to schedule_conflicts when overlap is detected.
 */
export class PluginSchedulingServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {}
}

export default PluginSchedulingServer;
