import { BehaviorSubject, Subject, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { WordAtPosition } from '@lyricistant/codemirror/wordSelection';
import { WordReplacement } from '@lyricistant/codemirror/CodeMirror';

const selectedWords = new BehaviorSubject<WordAtPosition>(null);
const replacedWords = new Subject<WordReplacement>();

const selectedWordStore = {
  selectedWords: (subscriber: (word: string) => void): Subscription =>
    selectedWords
      .pipe(
        filter((value) => value && !!value.word),
        map((value) => value.word),
        distinctUntilChanged()
      )
      .subscribe(subscriber),
  selectedWordPosition: (
    subscriber: (position: [number, number]) => void
  ): Subscription =>
    selectedWords
      .pipe(
        filter((value) => value && !!value.word),
        map((value) => [value.from, value.to]),
        distinctUntilChanged<[number, number]>()
      )
      .subscribe(subscriber),
  replacedWords: (
    subscriber: (replacement: WordReplacement) => void
  ): Subscription => replacedWords.subscribe(subscriber),
  onWordSelected: (word: WordAtPosition) => selectedWords.next(word),
  onWordReplaced: (word: WordReplacement) => replacedWords.next(word),
};

const SelectedWordStoreContext = createContext(selectedWordStore);

export const SelectedWordStore = ({ children }: { children: ReactNode }) => (
  <SelectedWordStoreContext.Provider value={selectedWordStore}>
    {children}
  </SelectedWordStoreContext.Provider>
);
export const useSelectedWordStore = () => useContext(SelectedWordStoreContext);
export const useSelectedWords = (): string => {
  const store = useSelectedWordStore();
  const [word, setWord] = useState<string>();
  useEffect(() => {
    const subscription = store.selectedWords(setWord);
    return () => subscription.unsubscribe();
  }, [store, setWord]);
  return word;
};
export const useSelectedWordPosition = (): [number, number] => {
  const store = useSelectedWordStore();
  const [word, setWord] = useState<[number, number]>();
  useEffect(() => {
    const subscription = store.selectedWordPosition(setWord);
    return () => subscription.unsubscribe();
  }, [store, setWord]);
  return word;
};
export const useReplacedWords = (): WordReplacement => {
  const store = useSelectedWordStore();
  const [word, setWord] = useState<WordReplacement>();
  useEffect(() => {
    const subscription = store.replacedWords(setWord);
    return () => subscription.unsubscribe();
  }, [store, setWord]);
  return word;
};
