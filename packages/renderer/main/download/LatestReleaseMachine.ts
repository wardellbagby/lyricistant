import {
  ReleaseData,
  ReleaseHelper,
} from '@lyricistant/common/releases/ReleaseHelper';
import { assign, createMachine, EventObject } from 'xstate';

let releaseHelper: ReleaseHelper = null;
const lazyReleaseHelper = () => {
  if (releaseHelper) {
    return releaseHelper;
  }
  releaseHelper = new ReleaseHelper(logger);
  return releaseHelper;
};

interface LatestReleaseContext {
  releaseData?: ReleaseData;
  error?: any;
}

interface LatestReleaseEvent extends EventObject {
  type: 'INPUT';
  currentVersion: string;
}

export const latestReleaseMachine = createMachine<
  LatestReleaseContext,
  LatestReleaseEvent
>({
  id: 'latest-release',
  initial: 'inactive',
  context: {
    releaseData: null,
  },
  on: {
    INPUT: [
      {
        target: '.loading',
      },
    ],
  },
  states: {
    inactive: {},
    loading: {
      invoke: {
        src: async (_, event) =>
          lazyReleaseHelper().getLatestDownloadableRelease(
            event.currentVersion,
            {
              includeCurrentVersion: true,
            }
          ),
        onDone: [
          {
            target: 'loaded',
            cond: (context, event) => event.data != null,
            actions: assign({
              releaseData: (context, event) => event.data,
            }),
          },
          { target: 'error' },
        ],
        onError: {
          target: 'error',
          actions: assign({
            releaseData: () => null,
          }),
        },
      },
    },
    loaded: {
      id: 'loaded',
    },
    error: {
      id: 'error',
    },
  },
});
