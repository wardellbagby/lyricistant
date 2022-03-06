export enum SystemTheme {
  Light,
  Dark,
}

export interface Palette {
  primary: string;
  background: string;
  surface: string;
  primaryText: string;
  secondaryText: string;
}

export type SystemPalette = Partial<Palette>;

export interface SystemThemeProvider {
  onChange: (
    listener: (theme: SystemTheme, palette?: SystemPalette) => void
  ) => void;
}
