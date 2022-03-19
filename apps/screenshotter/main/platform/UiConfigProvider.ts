import { UiConfigProvider } from '@lyricistant/common-platform/ui/UiConfigProviders';

export const provideUiConfig: UiConfigProvider = () => ({
  showDownload: false,
  showOpen: true,
  showBrowserWarning: false,
  promptOnUrlChange: false,
});
