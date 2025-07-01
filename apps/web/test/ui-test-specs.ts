import { flatMap, groupBy } from 'lodash';
import { BrowserType, chromium, firefox } from 'playwright';

interface Viewport {
  width: number;
  height: number;
}

interface Browser {
  type: BrowserType;
  label: string;
  args?: string[];
}

const viewports: Viewport[] = [
  {
    width: 360,
    height: 780,
  },
  {
    width: 1200,
    height: 1200,
  },
];

const browsers: Browser[] = [
  // TODO renable once we switch to Playright test runner; it bugs out with
  // launchPersistentContext
  //  { type: webkit, label: 'WebKit' },
  { type: firefox, label: 'Firefox' },
  {
    type: chromium,
    label: 'Chromium',
    args: [
      '--no-sandbox',
      '--disable-gpu',
      '--enable-logging',
      '--allow-file-access-from-files',
    ],
  },
];

const forceLegacyWebs = [false, true];

interface Spec {
  viewport: Viewport;
  browser: Browser;
  forceLegacyWeb: boolean;
}

const specs: Spec[] = flatMap(forceLegacyWebs, (forceLegacyWeb) =>
  flatMap(viewports, (viewport) =>
    flatMap(browsers, (browser) => ({
      viewport,
      browser,
      forceLegacyWeb,
    })),
  ),
);

export const webUiTestShardEnv = 'WEB_UI_TEST_SHARD';

const getShardGroups = () =>
  Object.values(groupBy(specs, (spec) => spec.browser.label));

export const getTotalShardCount = () => getShardGroups().length;

export const getSpecs = (): { shard: number; specs: Spec[] } => {
  const shard = parseInt(process.env[webUiTestShardEnv], 10) || -1;
  if (shard === -1) {
    return { shard: 0, specs };
  } else {
    return { shard, specs: getShardGroups()[shard - 1] };
  }
};
