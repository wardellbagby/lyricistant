export enum TitleFormatType {
  NONE,
  PREPEND_APP_NAME
}

export interface UiConfig {
  showDownload: boolean;
  showOpen: boolean;
  titleFormatType?: TitleFormatType;
}

export type UiConfigProvider = () => UiConfig;
