import { Text } from '@codemirror/state';
import { isUnderTest } from '@lyricistant/common/BuildModes';
import { RetextDiagnostic } from '@lyricistant/diagnostics-generator/diagnostics-generator';
import { assign, createMachine, EventObject, fromPromise } from 'xstate';

export interface Diagnostic {
  from: number;
  to: number;
  severity: 'info' | 'warning' | 'error';
  message: string;
  proposals?: string[];
}

type DiagnosticsGenerator =
  (typeof import('@lyricistant/diagnostics-generator'))['diagnosticsGenerator']['generateDiagnostics'];

const generateDiagnostics: (
  ...args: Parameters<DiagnosticsGenerator>
) => Promise<RetextDiagnostic[]> = (...args) =>
  import('@lyricistant/diagnostics-generator').then(
    ({ diagnosticsGenerator }) =>
      diagnosticsGenerator.generateDiagnostics(...args),
  );

/**
 * Converts the worker's line/column based diagnostics into the document
 * offsets that CodeMirror needs. Cheap enough to stay on the UI thread since
 * it's O(reported problems), not O(document).
 */
const toDiagnostics = (raw: RetextDiagnostic[], text: Text): Diagnostic[] =>
  raw
    .map((report): Diagnostic => {
      const line = text.line(report.line);
      const from = line.from + report.column - 1;
      const to =
        report.endColumn !== undefined
          ? line.from + report.endColumn - 1
          : from;

      return {
        from,
        to,
        severity: report.severity,
        message: report.message,
        proposals: report.proposals,
      };
    })
    .sort((left, right) => left.from - right.from);

const createDiagnostics = async (text: Text | null): Promise<Diagnostic[]> => {
  if (!text || text.length === 0) {
    return [];
  }

  return toDiagnostics(await generateDiagnostics(text.toString()), text);
};

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
