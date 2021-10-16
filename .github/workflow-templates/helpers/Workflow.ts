import {
  Job as RealJob,
  Step as RealStep,
  Workflow as RealWorkflow,
} from '@wardellbagby/gh-workflow-gen';
import * as versions from './versions';

export type Job = RealJob<typeof versions>;
export type Step = RealStep<typeof versions>;
export type Workflow = RealWorkflow<typeof versions>;
