declare module 'syllable' {
  export default function syllable(word: string): number;
}

interface AnalyticEvent {
  path?: string;
  title?: string;
  referrer?: string;
  event: boolean;
}

interface Analytics {
  count?: (event: AnalyticEvent) => void;
  path: (path: string) => string;
  allow_local: boolean;
}

declare module '*.png';
