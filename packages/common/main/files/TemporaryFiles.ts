export interface TemporaryFiles {
  set: (key: string, data: string) => void;
  get: (key: string) => Promise<string>;
  exists: (key: string) => Promise<boolean>;
  delete: (key: string) => void;
}
