import { Command } from 'commander';
import chalk from 'chalk';
import { getClient, parsePositiveInt } from '../../client.js';
import { AutomationEngine } from '../automations/engine.js';

export const autoCommand = new Command('auto').description('Manage automations');

autoCommand
  .command('list')
  .description('List all automations')
  .action(async function (this: Command) {
    const json = this.optsWithGlobals().json;
    const client = getClient();
    const engine = new AutomationEngine(client);
    const items = engine.list();
    engine.close();

    if (json) {
      console.log(JSON.stringify(items, null, 2));
      return;
    }

    if (!items.length) {
      console.log(chalk.dim('No automations. Use "auto create" to add one.'));
      return;
    }

    for (const a of items) {
      const status = a.enabled ? chalk.green('[on]') : chalk.dim('[off]');
      const actions = a.actions.map((act) => act.type).join(', ');
      console.log(`${status} ${chalk.bold(`#${a.id}`)} ${a.name}`);
      console.log(chalk.dim(`  trigger: ${a.trigger.type} | actions: ${actions} | runs: ${a.runCount}`));
    }
  });

autoCommand
  .command('create <name>')
  .description('Create an automation from a preset')
  .option('--preset <n>', 'Preset number (1-4)', '1')
  .action(async function (this: Command, name, opts) {
    const json = this.optsWithGlobals().json;
    const client = getClient();
    const engine = new AutomationEngine(client);
    const presetIdx = parseInt(opts.preset, 10) - 1;
    const presets = AutomationEngine.PRESETS;

    if (presetIdx < 0 || presetIdx >= presets.length) {
      engine.close();
      const msg = `Invalid preset. Choose 1-${presets.length}`;
      if (json) { console.log(JSON.stringify({ error: msg })); process.exit(1); }
      console.error(chalk.red(msg));
      process.exit(1);
    }

    const preset = presets[presetIdx];
    const auto = engine.create(name, preset.trigger, preset.actions);
    engine.close();

    if (json) {
      console.log(JSON.stringify(auto));
      return;
    }
    console.log(chalk.green(`Created automation #${auto.id}: ${auto.name}`));
  });

autoCommand
  .command('toggle <id>')
  .description('Enable/disable an automation')
  .action(async function (this: Command, id) {
    const json = this.optsWithGlobals().json;
    const client = getClient();
    const engine = new AutomationEngine(client);
    const numId = parsePositiveInt(id, 'automation ID');
    const ok = engine.toggle(numId);
    const auto = engine.get(numId);
    engine.close();

    if (json) {
      console.log(JSON.stringify({ ok, enabled: auto?.enabled }));
      return;
    }
    if (ok && auto) {
      console.log(chalk.green(`#${numId} is now ${auto.enabled ? 'enabled' : 'disabled'}`));
    } else {
      console.error(chalk.red('Automation not found'));
      process.exit(1);
    }
  });

autoCommand
  .command('run <id>')
  .description('Run an automation once (manually)')
  .action(async function (this: Command, id) {
    const json = this.optsWithGlobals().json;
    const client = getClient();
    const engine = new AutomationEngine(client);
    const numId = parsePositiveInt(id, 'automation ID');

    try {
      const result = await engine.runOnce(numId);
      engine.close();

      if (json) {
        console.log(JSON.stringify(result));
        return;
      }
      console.log(chalk.green(`Executed ${result.executed} action(s)`));
      if (result.errors.length) {
        for (const err of result.errors) {
          console.error(chalk.red(`  ${err}`));
        }
      }
    } catch (err: any) {
      engine.close();
      if (json) { console.log(JSON.stringify({ error: err.message })); process.exit(1); }
      console.error(chalk.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

autoCommand
  .command('remove <id>')
  .description('Delete an automation')
  .action(async function (this: Command, id) {
    const json = this.optsWithGlobals().json;
    const client = getClient();
    const engine = new AutomationEngine(client);
    const numId = parsePositiveInt(id, 'automation ID');
    const ok = engine.remove(numId);
    engine.close();

    if (json) {
      console.log(JSON.stringify({ ok }));
      return;
    }
    if (ok) {
      console.log(chalk.green(`Removed automation #${numId}`));
    } else {
      console.error(chalk.red('Automation not found'));
      process.exit(1);
    }
  });

autoCommand
  .command('presets')
  .description('Show available presets')
  .action(async function (this: Command) {
    const json = this.optsWithGlobals().json;
    const presets = AutomationEngine.PRESETS;

    if (json) {
      console.log(JSON.stringify(presets, null, 2));
      return;
    }

    presets.forEach((p, i) => {
      const actions = p.actions.map((a) => a.type).join(' + ');
      console.log(`${chalk.bold(`${i + 1}.`)} ${p.name}`);
      console.log(chalk.dim(`   trigger: ${p.trigger.type} | actions: ${actions}`));
    });
  });
