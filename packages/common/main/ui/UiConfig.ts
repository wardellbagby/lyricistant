export interface UiConfig {
  showDownload: boolean;
  showOpen: boolean;
  showBrowserWarning: boolean
}

export type UiConfigProvider = () => UiConfig;
export type TitleFormatter = (filename: string) => string;
