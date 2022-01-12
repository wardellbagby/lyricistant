import { Remote } from 'comlink';
import { BufferFileSystem } from './BufferFileSystem';
import { Storage } from './Storage';

export interface Renderer {
  receive: (channel: string, args: any[]) => void;
  getFileSystem: () => Promise<Remote<BufferFileSystem>>;
  getLocalStorage: () => Promise<Remote<Storage>>;
  getSessionStorage: () => Promise<Remote<Storage>>;
  showConfirmDialog: (message: string) => Promise<boolean>;
}
