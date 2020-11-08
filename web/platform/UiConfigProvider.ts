import {
  TitleFormatter,
  UiConfigProvider as IUiConfigProvider,
} from 'common/main/ui/UiConfig';

export const provideUiConfig: IUiConfigProvider = () => {
  return {
    showDownload: true,
    showOpen: !!Blob && !!File,
  };
};

export const formatTitle: TitleFormatter = (filename: string) =>
  `Lyricistant - ${filename ?? 'Untitled'}`;
