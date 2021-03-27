import * as fs from 'fs';
import yaml from 'js-yaml';
import * as gulpFile from 'gulpfile';
import { scripts } from '../package.json';

const COMMAND_REGEX = /npm run ([\w-_]+)|gulp ([\w-_]+)/g;

interface Workflow {
  jobs: {
    [name: string]: {
      name: string;
      steps: Array<{
        name: string;
        run?: string;
        with?: Record<string, string>;
      }>;
    };
  };
}
const dir = '.github/workflows';
const files = fs.readdirSync(dir);
const npmScripts = Object.keys(scripts).map((name) => `npm run ${name}`);
const gulpTasks = Object.keys(gulpFile).map((name) => `gulp ${name}`);

files.forEach((file) => {
  if (file.endsWith('.yml')) {
    const workflow: Workflow = yaml.safeLoad(
      fs.readFileSync(`${dir}/${file}`, 'utf8')
    ) as Workflow;

    Object.entries(workflow.jobs).forEach(([label, job]) => {
      job.steps.forEach((step) => {
        const { name, run } = step;
        const withBlock = step['with'];
        const matches =
          run?.match(COMMAND_REGEX) || withBlock?.command?.match(COMMAND_REGEX);
        if (matches) {
          matches.forEach((match) => {
            if (!npmScripts.includes(match) && !gulpTasks.includes(match)) {
              console.error(
                `Task "${match}", used in job "${label}" at step "${name}" in file "${file}", isn't an NPM script or a gulp task.`
              );
              process.exit(1);
            }
          });
        }
      });
    });
  }
});
