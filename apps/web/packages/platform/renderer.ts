import { Renderer } from '@web-common/Renderer';
import { Endpoint, wrap } from 'comlink';

export const renderer: Renderer = wrap(self as Endpoint);
