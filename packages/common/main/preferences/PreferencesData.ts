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
}
export interface PreferencesData extends ThemeData {
  rhymeSource: RhymeSource;
}
