import * as versions from './versions';

interface BranchesTagsOrPaths {
  branches?: string[];
  tags?: string[];
  paths?: string[];
}

interface Schedule {
  cron: string;
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
    push?: BranchesTagsOrPaths;
    pull_request?: BranchesTagsOrPaths;
    schedule?: Schedule[];
    workflow_dispatch?: Record<string, never>;
  };
  jobs: Record<string, Job>;
}
