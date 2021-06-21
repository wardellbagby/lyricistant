#!/usr/bin/env -S node -r ./register-ts-node
import fs from 'fs';
import { capitalCase } from 'change-case';
import prettier from 'prettier';
import {
  clearIdeaDirectories,
  clearVSCodeDirectories,
  getGroup,
  getGulpTasks,
  getIDEARunConfigFile,
  vsCodeLaunchFile,
} from './run_configs';

const ideaRunConfigTemplate = `<component name="ProjectRunConfigurationManager">
  <configuration default="false" name="{CONFIG_NAME}" type="js.build_tools.gulp" folderName="{FOLDER_NAME}">
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

const basicVSCodeConfig = {
  type: 'pwa-node',
  request: 'launch',
  skipFiles: ['<node_internals>/**'],
  console: 'internalConsole',
  outputCapture: 'std',
  program: 'node_modules/.bin/gulp',
};

clearIdeaDirectories();
clearVSCodeDirectories();

const vsCodeConfigs: Array<Record<string, any>> = [];
getGulpTasks().forEach((taskName) => {
  const folderName = getGroup(taskName);
  const displayName = capitalCase(taskName).replace('Ios', 'iOS').trim();
  let runConfig = ideaRunConfigTemplate
    .replace('{GULP_TASK_NAME}', taskName)
    .replace('{CONFIG_NAME}', displayName);

  if (folderName) {
    runConfig = runConfig.replace('{FOLDER_NAME}', folderName);
  } else {
    runConfig = runConfig.replace('folderName="{FOLDER_NAME}"', '');
  }

  fs.writeFileSync(getIDEARunConfigFile(taskName), runConfig);
  vsCodeConfigs.push({
    name: displayName,
    args: [taskName],
    ...basicVSCodeConfig,
  });
  console.log(`Wrote config for: ${taskName}`);
});

fs.writeFileSync(
  vsCodeLaunchFile,
  prettier.format(
    JSON.stringify({
      version: '0.2.0',
      configurations: vsCodeConfigs,
    }),
    {
      parser: 'json',
    }
  )
);
