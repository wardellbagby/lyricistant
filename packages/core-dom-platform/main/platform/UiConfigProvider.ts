import {
  TitleFormatter,
  UiConfigProvider,
} from '@lyricistant/common-platform/ui/UiConfigProviders';

export const provideUiConfig: UiConfigProvider = () => ({
  showDownload: true,
  showOpen: !!Blob && !!File,
  showBrowserWarning: true,
  promptOnUrlChange: true,
});

export const formatTitle: TitleFormatter = (filename: string) => {
  if (filename && filename.trim().length > 0) {
    return `Lyricistant - ${filename}`;
  }
  return 'Lyricistant';
};
