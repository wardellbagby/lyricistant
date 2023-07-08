import { RendererDelegate } from '@lyricistant/common/Delegates';
import { Logger } from '@lyricistant/common/Logger';
import { Manager } from '@lyricistant/common-platform/Manager';
import { Managers } from '@lyricistant/common-platform/Managers';
import { renderer } from '@web-platform/renderer';
import { expose, proxy } from 'comlink';
import { appComponent } from './AppComponent';
import { WebRendererDelegate } from './RendererDelegate';

self.onerror = (error) => {
  const availableLogger = appComponent?.get<Logger>() ?? console;
  availableLogger.error('Web Platform crashed', error);

  if (error instanceof ErrorEvent) {
    renderer.onError(error.error);
  } else if (typeof error === 'string') {
    renderer.onError(error);
  } else {
    renderer.onError(error);
  }
};
self.onunhandledrejection = (error) => {
  self.onerror(error.reason);
};

const start = () => {
  try {
    appComponent
      .get<Managers>()
      .forEach((manager: Manager) => manager.register());
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
