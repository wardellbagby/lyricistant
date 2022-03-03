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
export enum DefaultFileType {
  Always_Ask,
  Lyricistant_Lyrics,
  Plain_Text,
}
export type DisplayableColorScheme = ColorScheme.Light | ColorScheme.Dark;

export interface ThemeData {
  colorScheme: DisplayableColorScheme;
  textSize: number;
  font: Font;
  systemPalette?: SystemPalette;
}
export interface PreferencesData {
  colorScheme: ColorScheme;
  textSize: number;
  font: Font;
  rhymeSource: RhymeSource;
  defaultFileType: DefaultFileType;
}
