import { Remote } from 'comlink';
import { BufferFileSystem } from './BufferFileSystem';
import { Storage } from './Storage';

export interface Renderer {
  receive: (channel: string, args: unknown[]) => void;
  getFileSystem: () => Promise<Remote<BufferFileSystem>>;
  getLocalStorage: () => Promise<Remote<Storage>>;
  getSessionStorage: () => Promise<Remote<Storage>>;
  showConfirmDialog: (message: string) => Promise<boolean>;
  onError: (reason: unknown) => void;
}
