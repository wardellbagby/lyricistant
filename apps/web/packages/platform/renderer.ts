import { Renderer } from '@web-common/Renderer';
import { wrap } from 'comlink';

export const renderer: Renderer = wrap(self);
