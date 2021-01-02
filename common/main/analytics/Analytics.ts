interface AnalyticEvent {
  path?: string;
  title?: string;
  referrer?: string;
  event: boolean;
}

export interface Analytics {
  count?: (event: AnalyticEvent) => void;
  path: (path: string) => string;
  allow_local: boolean;
}
