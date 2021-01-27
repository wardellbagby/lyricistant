import { BehaviorSubject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
} from 'react';
import { WordAtPosition } from "@lyricistant-codemirror/wordSelection";

const subject = new BehaviorSubject<WordAtPosition>(null);

const selectedWordStore = {
  subscribe: (subscriber: (word: WordAtPosition) => void): Subscription =>
    subject
      .pipe(
        filter((value) => !!value),
        distinctUntilChanged(),
        debounceTime(400)
      )
      .subscribe(subscriber),
  onWordSelected: (word: WordAtPosition) => subject.next(word),
};

const SelectedWordStoreContext = createContext(selectedWordStore);

export const SelectedWordStore = ({ children }: { children: ReactNode }) => (
  <SelectedWordStoreContext.Provider value={selectedWordStore}>
    {children}
  </SelectedWordStoreContext.Provider>
);
export const useSelectedWordStore = () => useContext(SelectedWordStoreContext);
export const useSelectedWords = (
  onWordSelected: (word: WordAtPosition) => void
) => {
  const store = useSelectedWordStore();
  useEffect(() => {
    const subscription = store.subscribe(onWordSelected);
    return () => subscription.unsubscribe();
  });
};
