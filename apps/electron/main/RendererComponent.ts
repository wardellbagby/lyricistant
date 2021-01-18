import type { Logger } from '@common/Logger';
import { DIContainer } from '@wessberg/di';
import type { ElectronLogger } from './platform/Logger';

const createComponent = (): DIContainer => {
  const component = new DIContainer();
  component.registerSingleton<Logger, ElectronLogger>();
  return component;
};

export const rendererComponent = createComponent();
