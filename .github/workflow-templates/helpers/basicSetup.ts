import { Step } from './Workflow';
import { ifTrue } from './addIfTrue';
import { CACHE, CHECKOUT, SETUP_NODE, SETUP_RUBY } from './versions';

interface Options {
  forTests?: boolean;
  forMobileBuilds?: boolean;
}
export const basicSetup = (options?: Options): Step[] => {
  const { forTests, forMobileBuilds } = options ?? {
    forTests: false,
    forMobileBuilds: false,
  };
  return [
    {
      name: 'Mask any potential PII',
      run: [
        'echo "::add-mask::${{ secrets.PHONE_NUMBER }}"',
        'echo "::add-mask::${{ secrets.APPLE_ID }}"',
      ].join('\n'),
    },
    {
      name: 'Checkout the current branch',
      uses: CHECKOUT,
      with: {
        'fetch-depth': 0,
      },
    } as Step,
    {
      name: 'Setup Node.js - 15.x.x',
      uses: SETUP_NODE,
      with: {
        'node-version': '>=15.10',
        cache: 'npm',
      },
    } as Step,
    {
      uses: CACHE,
      name: 'Cache Node Modules',
      with: {
        path: '~/.npm',
        key: "${{ runner.os}}-node-${{ hashFiles('**/package-lock.json') }}",
        'restore-keys': '${{ runner.os }}-node-',
      },
    } as Step,
    {
      name: 'Install Gulp',
      run: 'npm install -g gulp@4.0.2',
    },
    ...ifTrue(forTests, {
      name: 'Set virtual display if Ubuntu',
      if: "runner.os == 'Linux'",
      run: 'Xvfb :99 &',
    }),
    ...ifTrue<Step>(
      forMobileBuilds,
      {
        name: 'Setup Ruby',
        uses: SETUP_RUBY,
        with: {
          'bundler-cache': true,
        },
      },
      {
        name: 'Install Fastlane',
        run: 'gem install bundler && bundle install',
      }
    ),
    {
      name: 'Install Node modules',
      run: 'npm ci',
    },
  ].filter((value) => value);
};
