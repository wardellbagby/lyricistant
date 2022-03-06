export interface RecentFiles {
  getRecentFiles: () => string[];
  setRecentFiles: (files: string[]) => void;
}
