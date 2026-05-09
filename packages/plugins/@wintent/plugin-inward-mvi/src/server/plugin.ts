import { Plugin } from '@nocobase/server';

/**
 * Wintent Inward MVI Plugin
 *
 * Registers the 5 universal inward-axis Minimum Viable Implementation
 * collections — applied to every Wintent instance regardless of which
 * vertical pack is active. These collections form the product DNA:
 *
 *   reflections     — periodic reflections (post-session / weekly / ad-hoc)
 *   learning_log    — what the user is studying (book / video / course / practice)
 *   aspirations     — long-term goals (5y / 1y / quarter)
 *   state_monitor   — energy / focus / mood time series
 *   soul_profile    — coaching style / proactive cadence / boundary rules
 *
 * Collections are auto-discovered from `./collections/` by NocoBase's
 * collection loader. No actions / resources / ACL are exposed yet —
 * those land in Iteration 3+ as flow-runtime begins consuming this data.
 */
export class PluginInwardMviServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {}
}

export default PluginInwardMviServer;
