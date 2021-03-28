import { DependencyList, useEffect } from 'react';

export const useDocumentListener = <EventName extends keyof DocumentEventMap>(
  event: EventName,
  listener: (event: DocumentEventMap[EventName]) => void,
  deps?: DependencyList
) => {
  useEffect(() => {
    const nestedListener = (documentEvent: DocumentEventMap[EventName]) =>
      listener(documentEvent);
      if(deps?.length === 2 && deps[0] === 6){
      console.log("nestedListener is being passed to document", event)
      }
    document.addEventListener(event, nestedListener);
    return () => document.removeEventListener(event, nestedListener);
  }, [listener, event, ...(deps ?? [])]);
};
