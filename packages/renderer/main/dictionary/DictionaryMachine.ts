import { isUnderTest } from '@lyricistant/common/BuildModes';
import axios from 'axios';
import { flattenDeep, uniq } from 'lodash-es';
import { assign, EventObject, fromPromise, setup } from 'xstate';

export interface DefinitionsResponse {
  meanings: Meaning[];
}

export interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
  synonyms: string[];
  antonyms: string[];
}

export interface Definition {
  definition: string;
  example: string;
  synonyms: string[];
  antonyms: string[];
}
interface DictionaryContext {
  input?: string;
  inputForResult?: string;
  result?: Meaning[];
  error?: unknown;
}

interface DictionaryEvent extends EventObject {
  type: 'INPUT';
  input: string;
}

const fetchDefinition = async (input: string): Promise<Meaning[]> => {
  logger.verbose(`Fetching definition for "${input}`);
  return axios
    .get<DefinitionsResponse[]>(input, {
      baseURL: 'https://api.dictionaryapi.dev/api/v2/entries/en/',
    })
    .then((response) => response.data[0].meanings);
};

/**
 * Giving a list of meanings, normalize the synonyms and antonyms so they appear
 * as separate words.
 *
 * Sometimes, the API will return related words in a single string like "hello,
 * world" instead of a string array like ["hello", "world"]. This fixes that.
 *
 * @param meanings The meanings potentially contained related words that need to
 *   be normalized.
 */
const normalize = (meanings: Meaning[]): Meaning[] =>
  meanings.map((meaning) => ({
    ...meaning,
    definitions: meaning.definitions.map((definition) => ({
      ...definition,
      synonyms: uniq(
        flattenDeep(
          definition.synonyms.map((synonym) =>
            synonym.split(',').map((value) => value.trim()),
          ),
        ),
      ),
      antonyms: uniq(
        flattenDeep(
          definition.antonyms.map((antonym) =>
            antonym.split(',').map((value) => value.trim()),
          ),
        ),
      ),
    })),
  }));

const fetchDefinitionActor = fromPromise<Meaning[], string>(async ({ input }) =>
  fetchDefinition(input),
);
export const dictionaryMachine = setup({
  types: {
    context: {} as DictionaryContext,
    events: {} as DictionaryEvent,
  },
  actors: {
    fetchDefinitionActor,
  },
  delays: {
    DEBOUNCE: () => (isUnderTest ? 100 : 1_000),
  },
  guards: {
    isValidInput: ({ context, event }) =>
      event.input &&
      event.input.trim().length > 0 &&
      !!event.input.match(/\w+/) &&
      event.input !== context.input,
  },
}).createMachine({
  id: 'dictionary',
  initial: 'waiting',
  context: {
    result: [],
  },
  on: {
    INPUT: [
      {
        target: '.loading',
        guard: 'isValidInput',
        actions: assign({
          input: ({ event }) => event.input,
        }),
      },
    ],
  },
  states: {
    waiting: {
      id: 'waiting',
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
                }),
              },
              { target: '#dictionary.waiting' },
            ],
          },
          after: {
            DEBOUNCE: {
              target: 'active',
            },
          },
        },
        active: {
          invoke: {
            src: 'fetchDefinitionActor',
            input: ({ context }) => context.input,
            onDone: [
              {
                target: '#displaying',
                guard: ({ event }) =>
                  Array.isArray(event.output) && event.output.length > 0,
                actions: assign({
                  inputForResult: ({ context }) => context.input,
                  result: ({ event }) => normalize(event.output),
                }),
              },
              {
                target: '#no-results',
                actions: assign({
                  result: ({ event }) => event.output ?? [],
                }),
              },
            ],
            onError: {
              target: '#no-results',
              actions: [
                assign({
                  error: ({ event }) => event.error,
                  result: [],
                }),
                ({ context }) =>
                  logger.warn(`Failed to load definition for ${context.input}`),
              ],
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
  },
});
