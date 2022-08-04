import axios from 'axios';
import { flattenDeep, uniq } from 'lodash-es';
import { assign, createMachine, EventObject } from 'xstate';

export interface DefinitionsResponse {
  meanings: Meaning[];
}

export interface Meaning {
  partOfSpeech: string;
  definitions: Definition[];
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
  error?: any;
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
            synonym.split(',').map((value) => value.trim())
          )
        )
      ),
      antonyms: uniq(
        flattenDeep(
          definition.antonyms.map((antonym) =>
            antonym.split(',').map((value) => value.trim())
          )
        )
      ),
    })),
  }));

export const dictionaryMachine = createMachine<
  DictionaryContext,
  DictionaryEvent
>({
  id: 'dictionary',
  initial: 'waiting',
  context: {
    result: [],
  },
  on: {
    INPUT: [
      {
        target: 'loading',
        cond: (context, event) =>
          event.input &&
          event.input.trim().length > 0 &&
          !!event.input.match(/\w+/) &&
          event.input !== context.input,
        actions: assign({
          input: (context, event) => event.input,
        }),
      },
      {
        target: 'no-results',
        actions: assign({
          result: [],
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
          after: {
            1000: 'active',
          },
        },
        active: {
          invoke: {
            src: async (context) => fetchDefinition(context.input),
            onDone: [
              {
                target: '#displaying',
                cond: (context, event) =>
                  Array.isArray(event.data) && event.data.length > 0,
                actions: assign({
                  inputForResult: (context) => context.input,
                  result: (context, event) => normalize(event.data),
                }),
              },
              {
                target: '#no-results',
                actions: assign({
                  result: (context, event) => event.data ?? [],
                }),
              },
            ],
            onError: {
              target: '#no-results',
              actions: [
                assign({
                  error: (context, event) => event.data,
                  result: [],
                }),
                (context) =>
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
