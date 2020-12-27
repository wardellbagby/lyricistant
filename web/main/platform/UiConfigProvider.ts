import {
  TitleFormatter,
  UiConfigProvider as IUiConfigProvider,
} from '@common/ui/UiConfig';

export const provideUiConfig: IUiConfigProvider = () => {
  return {
    showDownload: true,
    showOpen: !!Blob && !!File,
  };
};

export const formatTitle: TitleFormatter = (filename: string) =>
  `Lyricistant - ${filename ?? 'Untitled'}`;
