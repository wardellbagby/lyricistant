#!/usr/bin/env -S node -r ./register-ts-node
import * as fs from 'fs';
import * as path from 'path';
import yaml from 'js-yaml';
import {
  Workflow,
  Step,
} from '../../.github/workflow-templates/helpers/Workflow';
import * as gulpFile from '../../gulpfile';
import { scripts } from '../../package.json';

const COMMAND_REGEX = /npm run ([\w-_]+)|gulp ([\w-_]+)/g;

interface WorkflowLike extends Workflow {
  runs?: {
    steps: Step[];
  };
}

const toRelativePath = (file: string) => {
  const projectDirectory = path.resolve(__dirname, '../../') + path.sep;
  return file.replace(projectDirectory, '');
};

const readdirRecursiveSync = (dir: string) => {
  const results: string[] = [];
  if (!fs.existsSync(dir)) {
    return [];
  }

  fs.readdirSync(dir, { withFileTypes: true }).map((dirent) => {
    if (dirent.isFile()) {
      results.push(toRelativePath(path.resolve(dir, dirent.name)));
    } else if (dirent.isDirectory()) {
      results.push(...readdirRecursiveSync(path.resolve(dir, dirent.name)));
    }
  });
  return results;
};

const workflowsDir = '.github/workflows';
const actionsDir = '.github/actions';
const workflows = fs
  .readdirSync(workflowsDir)
  .map((file) => toRelativePath(path.resolve(workflowsDir, file)));
const actions = readdirRecursiveSync(actionsDir);
const files = [...workflows, ...actions];
const npmScripts = Object.keys(scripts).map((name) => `npm run ${name}`);
const gulpTasks = Object.keys(gulpFile).map((name) => `gulp ${name}`);

const isStepInvalid = ({ run, with: withBlock }: Step) => {
  const matches =
    run?.match(COMMAND_REGEX) ||
    (withBlock?.command as string)?.match(COMMAND_REGEX);
  if (matches) {
    for (const match of matches) {
      if (!npmScripts.includes(match) && !gulpTasks.includes(match)) {
        return match;
      }
    }
  }
  return false;
};

const isWorkflowEmpty = (workflow: WorkflowLike) =>
  !workflow.runs?.steps?.length &&
  !Object.entries(workflow.jobs ?? {})
    .map((value) => value[1].steps?.length)
    .reduce((total, next) => total + next);

files.forEach((file) => {
  if (file.endsWith('.yml')) {
    let workflow: WorkflowLike;
    try {
      workflow = yaml.load(fs.readFileSync(file, 'utf8')) as WorkflowLike;
    } catch (error) {
      console.error(`Failure to load file: ${file}`);
      throw error;
    }

    if (isWorkflowEmpty(workflow)) {
      throw Error(`No steps found in file: ${file}`);
    }

    workflow.runs?.steps?.forEach((step) => {
      const task = isStepInvalid(step);
      if (task) {
        console.error(
          `Task "${task}", used in step "${step.name}" in action "${file}", isn't an NPM script or a gulp task.`
        );
        process.exit(1);
      }
    });
    Object.entries(workflow.jobs ?? {}).forEach(([label, job]) => {
      job.steps.forEach((step) => {
        const task = isStepInvalid(step);
        if (task) {
          console.error(
            `Task "${task}", used in job "${label}" at step "${step.name}" in workflow "${file}", isn't an NPM script or a gulp task.`
          );
          process.exit(1);
        }
      });
    });
  }
});
