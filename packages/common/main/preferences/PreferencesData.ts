export enum Theme {
  Light,
  Dark,
  System,
}
export enum RhymeSource {
  Offline,
  Datmamuse,
}
export interface PreferencesData {
  textSize: number;
  theme: Theme;
  rhymeSource: RhymeSource;
}
