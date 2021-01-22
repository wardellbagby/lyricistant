import Store from 'electron-store';

interface AppStoreSchema {
  ignoredVersions: string[];
}
export class AppStore extends Store<AppStoreSchema> {
  constructor() {
    super({});
  }
}
