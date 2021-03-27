export interface TemporaryFiles {
  set: (data: string) => void;
  get: () => Promise<string>;
  exists: () => boolean;
  delete: () => void;
}
