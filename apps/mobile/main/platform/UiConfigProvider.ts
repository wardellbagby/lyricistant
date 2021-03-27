import {
  TitleFormatter,
  UiConfigProvider as IUiConfigProvider,
} from '@lyricistant/common/ui/UiConfig';

export const provideUiConfig: IUiConfigProvider = () => ({
  showDownload: false,
  showOpen: !!Blob && !!File,
});

export const formatTitle: TitleFormatter = (filename: string) =>
  `${filename ?? 'Untitled'}`;
