import { RendererDelegate } from 'common/Delegates';
import { FileManager } from 'common/files/FileManager';
import { Manager } from 'common/Manager';
import { PreferenceManager } from 'common/preferences/PreferenceManager';
import { UiConfigManager } from 'common/ui/UiConfigManager';

type ManagerConstructor<T extends Manager = Manager> = new (
  rendererDelegate: RendererDelegate
) => T;
const commonManagers: ManagerConstructor[] = [
  FileManager,
  PreferenceManager,
  UiConfigManager,
];

const registeredManagers: Map<ManagerConstructor, Manager> = new Map();
export const registerCommonManagers = (
  rendererDelegate: RendererDelegate
): void => {
  commonManagers.forEach((constructor) => {
    const manager = new constructor(rendererDelegate);
    manager.register();
    registeredManagers.set(constructor, manager);
  });
};

export function getCommonManager<T extends Manager>(
  manager: ManagerConstructor<T>
): T {
  return registeredManagers.get(manager) as T;
}
