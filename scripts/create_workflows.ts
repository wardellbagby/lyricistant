#!/usr/bin/env -S node -r ./register-ts-node

import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { nightlyReleases } from '../.github/workflow-templates/nightlyReleases';
import { Job, Workflow } from '../.github/workflow-templates/helpers/Workflow';
import { continuousIntegration } from '../.github/workflow-templates/continuousIntegration';

const fromEntries = <T>(entries: Array<[keyof T, T[keyof T]]>): T => {
  const newObject = Object.create(null);
  for (const [key, val] of entries) {
    newObject[key] = val;
  }
  return newObject;
};

/**
 * A very complicated way to replace the "needs" field with the actual key of
 * the job being depended on.
 *
 * @param workflow The Workflow to normalize.
 */
const normalize = (workflow: Workflow): Workflow => ({
  ...workflow,
  jobs: fromEntries(
    Object.entries(workflow.jobs).map((namedJob) => {
      const [name, job] = namedJob;
      return [
        name,
        {
          ...job,
          needs: (Array.isArray(job.needs)
            ? job.needs
            : job.needs === undefined
            ? undefined
            : [job.needs]
          )?.map((need: string | Job) => {
            if (typeof need === 'string') {
              return need;
            } else {
              const reference = Object.entries(workflow.jobs).find(
                (match) => match[1] === need
              );
              return reference[0];
            }
          }),
        },
      ];
    })
  ),
});
const writeWorkflow = (workflow: Workflow) => {
  const file = path.resolve(
    '.github/workflows',
    `${workflow.name.replace(' ', '-')}.yml`
  );
  workflow = normalize(workflow);
  fs.writeFileSync(file, yaml.dump(workflow));
};
const templates = [continuousIntegration, nightlyReleases];

const createWorkflows = () => {
  templates.forEach(writeWorkflow);
};

createWorkflows();
