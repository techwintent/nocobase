import { Plugin } from '@nocobase/server';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Wintent Fitness Actions Library Plugin
 *
 * Registers the `fitness_actions` collection and seeds it on first
 * enable with ~55 curated common exercises (Chinese names + category +
 * muscle groups + typical sets/reps + equipment).
 *
 * The seed runs once: it checks if the table is empty before inserting.
 * Re-enabling the plugin on an already-seeded DB is a no-op. The full
 * catalog is intentionally maintained as JSON in src/server/seed-data/
 * so a future GUI can also CRUD entries without conflicting with the
 * plugin's view of what "default" looks like.
 */
export class PluginFitnessActionsServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {}

  /**
   * NocoBase invokes this once per plugin-enable. Subsequent toggles
   * also call it but seedIfEmpty() handles idempotency.
   */
  async install() {
    await this.seedIfEmpty();
  }

  /**
   * Also call seed from afterEnable in case install was bypassed
   * (e.g. plugin discovered in storage/plugins/ on first boot).
   */
  async afterEnable() {
    await this.seedIfEmpty();
  }

  private async seedIfEmpty() {
    try {
      const repo = this.db.getRepository('fitness_actions');
      const existing = await repo.count();
      if (existing > 0) {
        this.log.info(
          `[plugin-fitness-actions] table has ${existing} rows, skipping seed`,
        );
        return;
      }

      const seedPath = resolve(__dirname, 'seed-data', 'fitness_actions.json');
      const seedRaw = readFileSync(seedPath, 'utf8');
      const seed = JSON.parse(seedRaw) as Array<Record<string, unknown>>;

      await repo.createMany({ records: seed });
      this.log.info(
        `[plugin-fitness-actions] seeded ${seed.length} default actions`,
      );
    } catch (err) {
      this.log.error('[plugin-fitness-actions] seed failed', err);
    }
  }
}

export default PluginFitnessActionsServer;
