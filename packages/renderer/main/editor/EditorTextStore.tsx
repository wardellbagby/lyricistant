import { BehaviorSubject, Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

const editorText = new BehaviorSubject<string>(null);

const editorTextStore = {
  editorText: (subscriber: (text: string) => void): Subscription =>
    editorText.pipe(distinctUntilChanged()).subscribe(subscriber),
  onEditorText: (text: string) => {
    editorText.next(text);
  },
};

const EditorTextStoreContext = createContext(editorTextStore);

export const EditorTextStore = ({ children }: { children: ReactNode }) => (
  <EditorTextStoreContext.Provider value={editorTextStore}>
    {children}
  </EditorTextStoreContext.Provider>
);

export const useEditorTextStore = () => useContext(EditorTextStoreContext);
export const useEditorText = (): string => {
  const store = useEditorTextStore();
  const [text, setText] = useState<string>();
  useEffect(() => {
    const subscription = store.editorText(setText);
    return () => subscription.unsubscribe();
  }, [store, setText]);
  return text;
};
