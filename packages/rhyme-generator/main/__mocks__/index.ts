import { ProxyMethods, Remote } from 'comlink';

type RealRhymeGenerator = typeof import('../index').rhymeGenerator;
type RhymeGenerator = Omit<RealRhymeGenerator, keyof ProxyMethods>;
const asFakeRemote = <T>(value: () => Promise<T>): Remote<() => Promise<T>> =>
  value as never;

export const rhymeGenerator: RhymeGenerator = {
  generateRhymes: asFakeRemote(() =>
    Promise.resolve([
      { word: 'Test Rhyme 1', score: 100 },
      { word: 'Test Rhyme 2', score: 99 },
      { word: 'Test Rhyme 3', score: 98 },
    ]),
  ),
};
