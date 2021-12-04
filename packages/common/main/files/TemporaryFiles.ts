export interface TemporaryFiles {
  set: (data: string) => void;
  get: () => Promise<string>;
  exists: () => Promise<boolean>;
  delete: () => void;
}
