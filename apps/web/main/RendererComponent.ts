import type { Logger } from '@common/Logger';
import { DIContainer } from '@wessberg/di';
import type { WebLogger } from './platform/Logger';

export const createComponent = (): DIContainer => {
  const component = new DIContainer();
  component.registerSingleton<Logger, WebLogger>();
  return component;
};
