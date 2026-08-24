import { ProxyMethods, Remote } from 'comlink';

type RealDiagnosticsGenerator = typeof import('../index').diagnosticsGenerator;
type DiagnosticsGenerator = Omit<RealDiagnosticsGenerator, keyof ProxyMethods>;
const asFakeRemote = <T>(value: () => Promise<T>): Remote<() => Promise<T>> =>
  value as never;

export const diagnosticsGenerator: DiagnosticsGenerator = {
  generateDiagnostics: asFakeRemote(() =>
    Promise.resolve([
      {
        line: 1,
        column: 1,
        endColumn: 5,
        severity: 'warning' as const,
        message: '"Test" is misspelled',
        proposals: ['Test Proposal 1', 'Test Proposal 2'],
      },
    ]),
  ),
};
