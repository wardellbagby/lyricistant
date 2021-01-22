import { UiConfigProvider as IUiConfigProvider } from '@common/ui/UiConfig';

export const provideUiConfig: IUiConfigProvider = () => ({ showDownload: false, showOpen: true });

export const formatTitle = (filename: string) => filename ?? 'Untitled';
