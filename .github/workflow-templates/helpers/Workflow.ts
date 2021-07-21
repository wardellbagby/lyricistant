import * as versions from './versions';

interface BranchesOrTags {
  branches?: string[];
  tags?: string[];
}
export interface Job {
  name: string;
  'runs-on': 'ubuntu-20.04' | 'macos-10.15';
  needs?: Array<string | Job> | string | Job;
  if?: string;
  steps: Step[];
}
export interface Step {
  name: string;
  if?: string;
  uses?: typeof versions[Extract<keyof typeof versions, string>];
  run?: string;
  with?: Record<string, string | boolean | number>;
  env?: Record<string, string | boolean>;
}
export interface Workflow {
  name: string;
  on: {
    push?: BranchesOrTags;
    pull_request?: BranchesOrTags;
  };
  jobs: Record<string, Job>;
}
