export interface RecentFiles {
  getRecentFiles: () => string[];
  addRecentFile: (filePath: string) => void;
}
