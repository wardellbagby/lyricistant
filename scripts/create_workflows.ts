#!/usr/bin/env -S node -r ./register-ts-node

import { continuousIntegration } from '../.github/workflow-templates/continuousIntegration';
import { generatePronunciations } from '../.github/workflow-templates/generatePronunciations';
import { nightlyReleases } from '../.github/workflow-templates/nightlyReleases';
import { productionReleases } from '../.github/workflow-templates/productionReleases';
import { dynamicImport } from 'tsimportlib';

const workflows = [
  continuousIntegration,
  nightlyReleases,
  productionReleases,
  generatePronunciations,
];

type GhWorkflowGen = typeof import('@wardellbagby/gh-workflow-gen');
dynamicImport('@wardellbagby/gh-workflow-gen', module).then(
  ({ writeWorkflow }: GhWorkflowGen) => {
    workflows.forEach((workflow) => writeWorkflow(workflow));
  },
);
