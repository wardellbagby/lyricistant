import { Renderer } from '@web-common/Renderer';
import { wrap } from 'comlink';

// TODO Webpack sometimes thinks self is a Window instead of a
// WorkerGlobalScope. Figure out why that happens.

export const renderer: Renderer = wrap(self as any);
