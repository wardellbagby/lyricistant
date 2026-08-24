import { retext } from 'retext';
import retextIndefiniteArticle from 'retext-indefinite-article';
import retextRepeatedWords from 'retext-repeated-words';
import retextSpell, { Dictionary } from 'retext-spell';
import { DictionaryOnLoad } from 'retext-spell/lib';
import { VFileMessage } from 'vfile-message';

/**
 * A diagnostic as reported by retext, using 1-based line and column positions.
 *
 * Positions are kept as line/column instead of document offsets so that this
 * can be structured-cloned out of the worker without needing a CodeMirror
 * {@link Text} on this side of the boundary.
 */
export interface RetextDiagnostic {
  line: number;
  column: number;
  endColumn?: number;
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

const loadDictionaryAsync: () => Promise<Dictionary> = async () => ({
  dic: (await import('dictionary-en/index.dic')).default,
  aff: (await import('dictionary-en/index.aff')).default,
});
const loadDictionary = (callback: DictionaryOnLoad) =>
  loadDictionaryAsync()
    .then((result) => callback(null, result))
    .catch((e) => callback(e));

/**
 * Runs the spelling and grammar checks against the given lyrics.
 *
 * The first invocation is expensive since it has to build the spellchecker's
 * dictionary; that's the entire reason this lives in a worker.
 *
 * @param text The lyrics to check.
 */
export const generateDiagnostics = async (
  text: string,
): Promise<RetextDiagnostic[]> => {
  if (!text || text.length === 0) {
    return [];
  }

  const result = await retext()
    .use(retextSpell, loadDictionary)
    .use(retextRepeatedWords)
    .use(retextIndefiniteArticle)
    .process(text);

  return result.messages.map(
    (report): RetextDiagnostic => ({
      line: report.line,
      column: report.column,
      endColumn:
        report.place && 'end' in report.place
          ? report.place.end.column
          : undefined,
      severity: report.fatal ? 'error' : 'warning',
      message: toDisplayMessage(report),
      proposals: report.expected,
    }),
  );
};
