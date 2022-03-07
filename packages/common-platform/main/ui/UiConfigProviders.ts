import { UiConfig } from '@lyricistant/common/ui/UiConfig';

export type UiConfigProvider = () => UiConfig;
export type TitleFormatter = (filename: string) => string;
