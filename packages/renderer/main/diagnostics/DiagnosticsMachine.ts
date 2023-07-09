import { Text } from '@codemirror/state';
import { isUnderTest } from '@lyricistant/common/BuildModes';
import { retext } from 'retext';
import retextIndefiniteArticle from 'retext-indefinite-article';
import retextRepeatedWords from 'retext-repeated-words';
import retextSpell, { Dictionary, VFile } from 'retext-spell';
import { VFileMessage } from 'vfile-message';
import { assign, createMachine, EventObject } from 'xstate';

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
      const to = report.position
        ? line.from + report.position.end.column - 1
        : from;

      return {
        from,
        to,
        severity: report.fatal ? 'error' : 'warning',
        message: toDisplayMessage(report),
        proposals: report.expected,
      };
    })
    .sort((left, right) => left.from - right.from);

const loadDictionary: Dictionary = (callback) => {
  let dic: unknown;
  let aff: unknown;

  new Promise(async (resolve) => {
    dic = (await import('dictionary-en/index.dic')).default;
    aff = (await import('dictionary-en/index.aff')).default;

    resolve({ dic, aff });
  })
    .catch((e) => callback(e))
    .then((result) => callback(null, result));
};
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
  error?: any;
}

interface DiagnosticsEvent extends EventObject {
  type: 'INPUT';
  input: Text;
}

export const diagnosticsMachine = createMachine<
  DiagnosticsContext,
  DiagnosticsEvent
>(
  {
    id: 'diagnostics',
    initial: 'waiting',
    context: {
      result: [],
    },
    on: {
      INPUT: [
        {
          target: 'loading',
          cond: 'isValidInput',
          actions: [
            assign({ input: (context, event) => event.input }),
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
                  cond: 'isValidInput',
                  actions: [
                    assign({ input: (context, event) => event.input }),
                    assign({ result: [] }),
                  ],
                },
                { target: '#diagnostics.waiting' },
              ],
            },
            after: [
              {
                delay: 'DEBOUNCE',
                target: 'active',
              },
            ],
          },
          active: {
            invoke: {
              src: async (context) => createDiagnostics(context.input),
              onDone: [
                {
                  target: '#displaying',
                  cond: (context, event) =>
                    Array.isArray(event.data) && event.data.length > 0,
                  actions: assign({
                    result: (context, event) => event.data,
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
                    logger.warn(
                      `Failed to load diagnostics for text`,
                      context.error
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
      isValidInput: (context, event) => context.input !== event.input,
    },
  }
);
