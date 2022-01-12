import { assign, createMachine, EventObject } from 'xstate';
import { Rhyme } from '@lyricistant/renderer/rhymes/rhyme';
import { fetchRhymes as datamuseRhymes } from '@lyricistant/renderer/rhymes/datamuse';
import { RhymeSource } from '@lyricistant/common/preferences/PreferencesData';

type generateRhymes =
  typeof import('@lyricistant/rhyme-generator')['rhymeGenerator']['generateRhymes'];

const offlineRhymes = (...args: Parameters<generateRhymes>) =>
  import('@lyricistant/rhyme-generator').then((value) =>
    value.rhymeGenerator.generateRhymes(...args)
  );

interface RhymesContext {
  rhymeSource?: RhymeSource;
  input?: string;
  rhymes: Rhyme[];
  error?: any;
}

interface RhymesEvent extends EventObject {
  type: 'INPUT';
  input: string;
  rhymeSource: RhymeSource;
}

const fetchRhymes = async (input: string, rhymeSource: RhymeSource) => {
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
          e
        );
        results = await offlineRhymes(input);
      }
      break;
  }

  return results.filter((rhyme) => rhyme && rhyme.word && rhyme.score);
};

export const rhymesMachine = createMachine<RhymesContext, RhymesEvent>({
  id: 'rhymes',
  initial: 'inactive',
  context: {
    rhymes: [],
  },
  on: {
    INPUT: [
      {
        target: '.loading',
        cond: (context, event) =>
          context.input !== event.input ||
          context.rhymeSource !== event.rhymeSource,
        actions: assign({
          input: (context, event) => event.input,
          rhymeSource: (context, event) => event.rhymeSource,
        }),
      },
    ],
  },
  states: {
    inactive: {},
    loading: {
      initial: 'debouncing',
      states: {
        debouncing: {
          after: {
            400: 'active',
          },
        },
        active: {
          invoke: {
            id: 'fetch-rhymes',
            src: async (context) =>
              fetchRhymes(context.input, context.rhymeSource),
            onDone: [
              {
                target: '#displaying',
                cond: (context, event) =>
                  Array.isArray(event.data) && event.data.length > 0,
                actions: assign({
                  rhymes: (context, event) => event.data,
                }),
              },
              {
                target: '#no-results',
                actions: assign({
                  rhymes: (context, event) => event.data,
                }),
              },
            ],
            onError: {
              target: '#error',
              actions: assign({
                error: (context, event) => event.data,
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
});
