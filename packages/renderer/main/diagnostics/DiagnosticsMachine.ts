import { Text } from '@codemirror/state';
import { isUnderTest } from '@lyricistant/common/BuildModes';
import { retext } from 'retext';
import retextIndefiniteArticle from 'retext-indefinite-article';
import retextRepeatedWords from 'retext-repeated-words';
import retextSpell, { Dictionary } from 'retext-spell';
import { VFile, DictionaryOnLoad } from 'retext-spell/lib';
import { VFileMessage } from 'vfile-message';
import { assign, createMachine, EventObject, fromPromise } from 'xstate';

export interface Diagnostic {
  from: number;
  to: number;
  severity: 'info' | 'warning' | 'error';
  message: string;
  proposals?: string[];
}

const backticksToQuotes = (value: string): string => value.replace(/`/g, '"');

const toDisplayMessage = (report: VFileMessage): string => {
  if (report.source === 'retext-spell') {
    return `"${report.actual}" is misspelled`;
  }
  return backticksToQuotes(report.message);
};
const toDiagnostics = (file: VFile, text: Text): Diagnostic[] =>
  file.messages
    .map((report): Diagnostic => {
      const line = text.line(report.line);
      const from = line.from + report.column - 1;
      const to =
        'end' in report.place ? line.from + report.place.end.column - 1 : from;

      return {
        from,
        to,
        severity: report.fatal ? 'error' : 'warning',
        message: toDisplayMessage(report),
        proposals: report.expected,
      };
    })
    .sort((left, right) => left.from - right.from);

const loadDictionaryAsync: () => Promise<Dictionary> = async () => ({
  dic: (await import('dictionary-en/index.dic')).default,
  aff: (await import('dictionary-en/index.aff')).default,
});
const loadDictionary = (callback: DictionaryOnLoad) =>
  loadDictionaryAsync()
    .then((result) => callback(null, result))
    .catch((e) => callback(e));

const retextDiagnostics = async (text: Text | null): Promise<Diagnostic[]> => {
  if (!text || text.length === 0) {
    return [];
  }

  const result = await retext()
    .use(retextSpell, loadDictionary)
    .use(retextRepeatedWords)
    .use(retextIndefiniteArticle)
    .process(text.toString());

  return toDiagnostics(result, text);
};

const createDiagnostics = async (text: Text | null): Promise<Diagnostic[]> =>
  retextDiagnostics(text);

interface DiagnosticsContext {
  input?: Text;
  result?: Diagnostic[];
  error?: unknown;
}

interface DiagnosticsEvent extends EventObject {
  type: 'INPUT';
  input: Text;
}

export const diagnosticsMachine = createMachine(
  {
    types: {} as {
      context: DiagnosticsContext;
      events: DiagnosticsEvent;
    },
    id: 'diagnostics',
    initial: 'waiting',
    context: {
      result: [],
    },
    on: {
      INPUT: [
        {
          target: '.loading',
          guard: 'isValidInput',
          actions: [
            assign({ input: ({ event }) => event.input }),
            assign({ result: [] }),
          ],
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
                  actions: [
                    assign({ input: ({ event }) => event.input }),
                    assign({ result: [] }),
                  ],
                },
                { target: '#diagnostics.waiting' },
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
              input: ({ context }) => context.input,
              src: fromPromise<Diagnostic[], Text>(async ({ input }) =>
                createDiagnostics(input),
              ),
              onDone: [
                {
                  target: '#displaying',
                  guard: ({ event }) =>
                    Array.isArray(event.output) && event.output.length > 0,
                  actions: assign({
                    result: ({ event }) => event.output,
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
                    logger.warn(
                      `Failed to load diagnostics for text`,
                      context.error,
                    ),
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
  },
  {
    delays: {
      DEBOUNCE: () => (isUnderTest ? 100 : 1_000),
    },
    guards: {
      isValidInput: ({ context, event }) => context.input !== event.input,
    },
  },
);
