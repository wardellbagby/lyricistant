import { defaultMacOsRunner } from '../Runners';
import { basicSetup } from './basicSetup';
import { gulp } from './local-tasks';
import { DOWNLOAD_ARTIFACT, RETRY, UPLOAD_ARTIFACT } from './versions';
import { Job, Step } from './Workflow';

const ELECTRON_TAG = 'electron-apps';
interface Options {
  nightly: boolean;
}
export const buildElectronApps = (options?: Options): Job => {
  const { nightly } = options ?? { nightly: false };
  return {
    name: 'Build Electron Apps',
    'runs-on': defaultMacOsRunner,
    steps: [
      ...basicSetup(),
      {
        name: 'Build Electron apps',
        uses: RETRY,
        env: {
          CSC_LINK: '${{ secrets.MACOS_CERT }}',
          CSC_KEY_PASSWORD: '${{ secrets.MACOS_CERT_PASSWORD }}',
          APPLE_ID: '${{ secrets.APPLE_ID }}',
          APPLE_ID_PASSWORD: '${{ secrets.APPLE_ID_PASSWORD }}',
          NIGHTLY: nightly,
        },
        with: {
          timeout_minutes: 20,
          max_attempts: 3,
          command: gulp('buildAllElectronApps'),
        },
      },
      {
        name: 'Upload Electron apps',
        uses: UPLOAD_ARTIFACT,
        with: {
          name: ELECTRON_TAG,
          path: 'apps/electron/dist/production/app/*.*',
        },
      },
    ],
  };
};

export const downloadElectronApps = ({ path }: { path: string }): Step => ({
  name: 'Download Electron apps',
  uses: DOWNLOAD_ARTIFACT,
  with: {
    name: ELECTRON_TAG,
    path,
  },
});
