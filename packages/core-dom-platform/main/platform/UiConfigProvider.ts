import {
  TitleFormatter,
  UiConfigProvider as IUiConfigProvider,
} from '@lyricistant/common/ui/UiConfig';

export const provideUiConfig: IUiConfigProvider = () => ({
  showDownload: true,
  showOpen: !!Blob && !!File,
  showBrowserWarning: true,
});

export const formatTitle: TitleFormatter = (filename: string) =>
  `Lyricistant - ${filename ?? 'Untitled'}`;
