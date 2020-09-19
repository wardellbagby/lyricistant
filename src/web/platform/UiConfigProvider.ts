import { UiConfigProvider as IUiConfigProvider } from 'common/ui/UiConfig';

export const provideUiConfig: IUiConfigProvider = () => {
  return { showDownload: true, showOpen: !!Blob && !!File };
};
