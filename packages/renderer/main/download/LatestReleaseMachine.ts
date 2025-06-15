import {
  ReleaseData,
  ReleaseHelper,
} from '@lyricistant/common/releases/ReleaseHelper';
import { assign, createMachine, EventObject, fromPromise } from 'xstate';

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
  error?: unknown;
}

interface LatestReleaseEvent extends EventObject {
  type: 'INPUT';
  currentVersion: string;
}

export const latestReleaseMachine = createMachine({
  types: {} as {
    context: LatestReleaseContext;
    events: LatestReleaseEvent;
  },
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
        input: ({ event }) => event,
        src: fromPromise<ReleaseData, LatestReleaseEvent>(async ({ input }) =>
          lazyReleaseHelper().getLatestDownloadableRelease(
            input.currentVersion,
            {
              includeCurrentVersion: true,
            },
          ),
        ),
        onDone: [
          {
            target: 'loaded',
            guard: (args) => args.event.output != null,
            actions: assign({
              releaseData: (args) => args.event.output,
            }),
          },
          { target: 'error' },
        ],
        onError: {
          target: 'error',
          actions: assign({
            releaseData: (): null => null,
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
