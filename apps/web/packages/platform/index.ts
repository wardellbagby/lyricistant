import { Managers } from '@lyricistant/common/Managers';
import { Manager } from '@lyricistant/common/Manager';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { expose, proxy } from 'comlink';
import { Logger } from '@lyricistant/common/Logger';
import { WebRendererDelegate } from './RendererDelegate';
import { appComponent } from './AppComponent';

const start = async () => {
  appComponent
    .get<Managers>()
    .forEach((manager: () => Manager) => manager().register());
};

const getRendererDelegate = () =>
  appComponent.get<RendererDelegate>() as WebRendererDelegate;

export const receive = (channel: string, args: any[]) => {
  getRendererDelegate().receive(channel, args);
};

const getLogger = () => {
  const logger = appComponent.get<Logger>();
  return proxy(logger);
};

export const onRendererListenerSet = (channel: string) => {
  getRendererDelegate().onRendererListenerSet(channel);
};

expose({
  receive,
  onRendererListenerSet,
  getLogger,
  start,
});
