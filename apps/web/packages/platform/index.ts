import { Managers } from '@lyricistant/common/Managers';
import { Manager } from '@lyricistant/common/Manager';
import { RendererDelegate } from '@lyricistant/common/Delegates';
import { expose, proxy } from 'comlink';
import { Logger } from '@lyricistant/common/Logger';
import { renderer } from '@web-platform/renderer';
import { WebRendererDelegate } from './RendererDelegate';
import { appComponent } from './AppComponent';

self.onerror = (error) => {
  const availableLogger = appComponent?.get<Logger>() ?? console;
  availableLogger.error('Web Platform crashed', error);

  renderer.onError(error);
};
self.onunhandledrejection = (error) => {
  self.onerror(error.reason);
};

const start = () => {
  try {
    appComponent
      .get<Managers>()
      .forEach((manager: () => Manager) => manager().register());
  } catch (e) {
    self.onerror(e);
  }
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
