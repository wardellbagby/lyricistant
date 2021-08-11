import { BehaviorSubject, Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { PreferencesData } from '@lyricistant/common/preferences/PreferencesData';
import { useChannel } from '@lyricistant/renderer/platform/useChannel';

const preferences = new BehaviorSubject<PreferencesData>(null);

const preferencesStore = {
  preferences: (
    subscriber: (preferences: PreferencesData) => void
  ): Subscription =>
    preferences.pipe(distinctUntilChanged()).subscribe(subscriber),
  onPreferences: (prefs: PreferencesData) => preferences.next(prefs),
};

const PreferencesStoreContext = createContext(preferencesStore);

export const PreferencesStore = ({ children }: { children: ReactNode }) => {
  useChannel('prefs-updated', preferencesStore.onPreferences);

  return (
    <PreferencesStoreContext.Provider value={preferencesStore}>
      {children}
    </PreferencesStoreContext.Provider>
  );
};

export const usePreferencesStore = () => useContext(PreferencesStoreContext);
export const usePreferences = (): PreferencesData | undefined => {
  const store = usePreferencesStore();
  const [prefs, setPrefs] = useState<PreferencesData>();

  useEffect(() => {
    const subscription = store.preferences(setPrefs);
    return () => subscription.unsubscribe();
  }, [store, setPrefs]);

  return prefs;
};
