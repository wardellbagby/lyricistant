/**
 * Both the rhyme generator and the diagnostics generator do expensive one-time
 * setup the first time they're asked for anything: the rhyme generator parses
 * a multi-megabyte pronunciation dictionary, and the diagnostics generator
 * builds a spellchecker out of a hunspell dictionary.
 *
 * That work happens in a worker, so it no longer blocks the UI thread, but the
 * user still waits for it the first time they type a word. Kicking both off
 * while the app is idle means the cost is usually already paid by then.
 */
import { useEffect } from 'react';

const whenIdle = (callback: () => void): (() => void) => {
  if (typeof requestIdleCallback === 'function') {
    const handle = requestIdleCallback(callback, { timeout: 5_000 });
    return () => cancelIdleCallback(handle);
  }

  const handle = setTimeout(callback, 1_000);
  return () => clearTimeout(handle);
};

const warm = (name: string, load: () => Promise<unknown>) => {
  load().catch((reason) => {
    logger.warn(`Failed to warm up ${name}`, reason);
  });
};

export const useWarmWorkers = () =>
  useEffect(
    () =>
      whenIdle(() => {
        warm('the rhyme generator', () =>
          import('@lyricistant/rhyme-generator').then(({ rhymeGenerator }) =>
            rhymeGenerator.generateRhymes(''),
          ),
        );
        warm('the diagnostics generator', () =>
          import('@lyricistant/diagnostics-generator').then(
            ({ diagnosticsGenerator }) =>
              /*
              Deliberately not the empty string: the generator short-circuits
              on that and would never build the dictionary, which is the
              expensive part we're here to pay for.
               */
              diagnosticsGenerator.generateDiagnostics('warmup'),
          ),
        );
      }),
    [],
  );
