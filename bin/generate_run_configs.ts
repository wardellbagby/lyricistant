#!/usr/bin/env -S node -r ./register-ts-node
import fs from 'fs';
import { capitalCase } from 'change-case';
import {
  getGulpTasks,
  getRunConfigFile,
  runConfigDirectory,
} from './run_configs';

const runConfigTemplate = `<component name="ProjectRunConfigurationManager">
  <configuration default="false" name="{CONFIG_NAME}" type="js.build_tools.gulp">
    <node-interpreter>project</node-interpreter>
    <node-options />
    <gulpfile>$PROJECT_DIR$/gulpfile.js</gulpfile>
    <tasks>
      <task>{GULP_TASK_NAME}</task>
    </tasks>
    <arguments />
    <envs />
    <method v="2" />
  </configuration>
</component>`;

fs.rmdirSync(runConfigDirectory, { recursive: true });
fs.mkdirSync(runConfigDirectory);

getGulpTasks().forEach((taskName) => {
  const runConfig = runConfigTemplate
    .replace('{GULP_TASK_NAME}', taskName)
    .replace('{CONFIG_NAME}', capitalCase(taskName).replace('Ios', 'iOS'));

  fs.writeFileSync(getRunConfigFile(taskName), runConfig);
  console.log(`Wrote config for: ${taskName}`);
});
