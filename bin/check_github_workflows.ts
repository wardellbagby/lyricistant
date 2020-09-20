import * as fs from 'fs';
import yaml from 'js-yaml';
import { scripts } from '../package.json';

interface Workflow {
  jobs: {
    [name: string]: {
      name: string;
      steps: Array<{ name: string; run: string }>;
    };
  };
}

const dir = '.github/workflows';
const files = fs.readdirSync(dir);
files.forEach((file) => {
  if (file.endsWith('.yml')) {
    const workflow: Workflow = yaml.safeLoad(
      fs.readFileSync(`${dir}/${file}`, 'utf8')
    ) as Workflow;

    Object.entries(workflow.jobs).forEach(([label, job]) => {
      job.steps
        .filter(({ run }) => !!run)
        .forEach(({ name, run }) => {
          const matches = run.match(/npm run ([\w-_]+)/g);
          if (matches) {
            matches.forEach((match) => {
              const scriptName = match.replace('npm run ', '');
              if (!(scriptName in scripts)) {
                throw Error(
                  `NPM script "${scriptName}", used in job "${label}" at step "${name}" isn't in the package.json`
                );
              }
            });
          }
        });
    });
  }
});
