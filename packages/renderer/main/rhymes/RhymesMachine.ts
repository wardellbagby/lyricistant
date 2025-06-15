import { isUnderTest } from '@lyricistant/common/BuildModes';
import { RhymeSource } from '@lyricistant/common/preferences/PreferencesData';
import { fetchRhymes as datamuseRhymes } from '@lyricistant/renderer/rhymes/datamuse';
import { Rhyme } from '@lyricistant/renderer/rhymes/rhyme';
import { assign, createMachine, EventObject, fromPromise } from 'xstate';

type generateRhymes =
  (typeof import('@lyricistant/rhyme-generator'))['rhymeGenerator']['generateRhymes'];

const offlineRhymes = (...args: Parameters<generateRhymes>) =>
  import('@lyricistant/rhyme-generator').then(({ rhymeGenerator }) =>
    rhymeGenerator.generateRhymes(...args),
  );

interface RhymesContext {
  rhymeSource?: RhymeSource;
  input?: string;
  rhymes: Rhyme[];
  error?: unknown;
}

interface RhymesEvent extends EventObject {
  type: 'INPUT';
  input: string;
  rhymeSource: RhymeSource;
}

export type RhymesState = ReturnType<(typeof rhymesMachine)['resolveState']>;

const fetchRhymes = async (
  input: string,
  rhymeSource: RhymeSource,
): Promise<Rhyme[]> => {
  let results: Rhyme[];
  switch (rhymeSource) {
    case RhymeSource.Offline:
      results = await offlineRhymes(input);
      break;
    case RhymeSource.Datamuse:
      try {
        results = await datamuseRhymes(input);
      } catch (e) {
        logger.warn(
          'Failed to fetch Datamuse rhymes; falling back to offline',
          e,
        );
        results = await offlineRhymes(input);
      }
      break;
  }

  return results.filter((rhyme) => rhyme && rhyme.word && rhyme.score);
};

/** A State Machine that handles fetching rhymes based on a query and returning a result. */
export const rhymesMachine = createMachine(
  {
    types: {} as {
      context: RhymesContext;
      event: RhymesEvent;
    },
    id: 'rhymes',
    initial: 'inactive',
    context: {
      rhymes: [],
    },
    on: {
      INPUT: [
        {
          target: '.loading',
          guard: 'isValidInput',
          actions: assign({
            input: ({ event }) => event.input,
            rhymeSource: ({ event }) => event.rhymeSource,
          }),
        },
      ],
    },
    states: {
      inactive: {
        id: '#inactive',
      },
      loading: {
        initial: 'debouncing',
        states: {
          debouncing: {
            on: {
              INPUT: [
                {
                  target: 'debouncing',
                  guard: 'isValidInput',
                  actions: assign({
                    input: ({ event }) => event.input,
                    rhymeSource: ({ event }) => event.rhymeSource,
                  }),
                },
                { target: '#rhymes.inactive' },
              ],
            },
            after: {
              DEBOUNCE: { target: 'active' },
            },
          },
          active: {
            invoke: {
              id: 'fetch-rhymes',
              input: ({ context }) => context,
              src: fromPromise<Rhyme[], RhymesContext>(
                async ({ input: context }) =>
                  fetchRhymes(context.input, context.rhymeSource),
              ),
              onDone: [
                {
                  target: '#displaying',
                  guard: ({ event }) =>
                    Array.isArray(event.output) && event.output.length > 0,
                  actions: assign({
                    rhymes: ({ event }) => event.output,
                  }),
                },
                {
                  target: '#no-results',
                  actions: assign({
                    rhymes: ({ event }) => event.output,
                  }),
                },
              ],
              onError: {
                target: '#error',
                actions: assign({
                  error: ({ event }) => event.error,
                }),
              },
            },
          },
        },
      },
      displaying: {
        id: 'displaying',
      },
      'no-results': {
        id: 'no-results',
      },
      error: {
        id: 'error',
      },
    },
  },
  {
    delays: {
      DEBOUNCE: () => (isUnderTest ? 100 : 1_000),
    },
    guards: {
      isValidInput: ({ context, event }) =>
        context.input !== event.input ||
        context.rhymeSource !== event.rhymeSource,
    },
  },
);
