export enum SystemTheme {
  Light,
  Dark,
}

export interface SystemThemeProvider {
  onChange: (listener: (theme: SystemTheme) => void) => void;
}
