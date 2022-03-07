#!/usr/bin/env -S node -r ./register-ts-node
import * as fs from 'fs';
import path from 'path';
import { capitalCase, snakeCase } from 'change-case';
import { Command } from 'commander';
import prettier from 'prettier';
import * as gulpFile from '../../gulpfile';

const ideaConfigFileName = (taskName: string) => `${snakeCase(taskName)}.xml`;
const ideaRunConfigDirectory = path.resolve('.idea/runConfigurations');

const clearIdeaDirectories = () => {
  fs.rmdirSync(ideaRunConfigDirectory, { recursive: true });
  fs.mkdirSync(ideaRunConfigDirectory);
};
const clearVSCodeDirectories = () => {
  const vsCodeDirectory = path.resolve(vsCodeLaunchFile, '..');
  if (!fs.existsSync(vsCodeDirectory)) {
    fs.mkdirSync(path.resolve(vsCodeLaunchFile, '..'));
  }
};

const getGroup = (taskName: string): string => {
  const groupings = ['build', 'open', 'start', 'test'];
  for (const group of groupings) {
    if (taskName.startsWith(group)) {
      return capitalCase(group);
    }
  }
  return null;
};
const getIDEARunConfigFile = (taskName: string) =>
  path.resolve(ideaRunConfigDirectory, ideaConfigFileName(taskName));

const vsCodeLaunchFile = path.resolve('.vscode/launch.json');

const getGulpTasks = () => Object.keys(gulpFile).sort();
const vsCodeLaunch = JSON.parse(fs.readFileSync(vsCodeLaunchFile, 'utf8'));

const verifyVSCodeTask = (taskName: string): boolean =>
  vsCodeLaunch['configurations']
    .map((config: Record<string, any>) => config.args[0])
    .includes(taskName);
const verifyIDEATask = (taskName: string): boolean => {
  const file = getIDEARunConfigFile(taskName);
  return (
    fs.existsSync(file) &&
    fs.readFileSync(file, 'utf8').includes(`<task>${taskName}</task>`)
  );
};

let hasFailed = false;
const fail = (taskName: string, type: string) => {
  console.error(`${type}: Missing run configuration for task "${taskName}".`);
  hasFailed = true;
};

const check = () => {
  getGulpTasks().forEach((taskName) => {
    if (!verifyIDEATask(taskName)) {
      fail(taskName, 'IDEA');
    }
    if (!verifyVSCodeTask(taskName)) {
      fail(taskName, 'VS Code');
    }
  });

  if (hasFailed) {
    console.error(
      'Try running "npm run lint-fix" to generate missing run configurations.'
    );
    process.exit(1);
  }
};

const generate = () => {
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
};

const program = new Command();
program.option('--fix', 'Recreate all run configurations.');
program.parse(process.argv);

if (program.opts().fix) {
  generate();
} else {
  check();
}
