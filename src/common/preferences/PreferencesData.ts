export enum Theme {
  Light,
  Dark,
  System
}
export interface PreferencesData {
  textSize: number;
  theme?: Theme;
}
