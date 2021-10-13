import { SystemPalette } from '@lyricistant/common/theme/SystemTheme';

export enum ColorScheme {
  Light,
  Dark,
  System,
}
export enum Font {
  Roboto_Mono,
  Roboto,
}
export enum RhymeSource {
  Offline,
  Datamuse,
}

export interface ThemeData {
  colorScheme: ColorScheme;
  textSize: number;
  font: Font;
  systemPalette?: SystemPalette;
}
export interface PreferencesData extends Omit<ThemeData, 'systemPalette'> {
  rhymeSource: RhymeSource;
}
