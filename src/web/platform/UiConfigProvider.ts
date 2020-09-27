import {
  TitleFormatter,
  TitleFormatType,
  UiConfigProvider as IUiConfigProvider,
} from 'common/ui/UiConfig';

export const provideUiConfig: IUiConfigProvider = () => {
  return {
    showDownload: true,
    showOpen: !!Blob && !!File,
    titleFormatType: TitleFormatType.PREPEND_APP_NAME,
  };
};

export const formatTitle: TitleFormatter = (filename: string) =>
  `Lyricistant - ${filename ?? 'Untitled'}`;
