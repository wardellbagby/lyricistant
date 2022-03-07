import {
  SystemPalette,
  SystemTheme,
} from '@lyricistant/common/theme/SystemTheme';

export interface SystemThemeProvider {
  onChange: (
    listener: (theme: SystemTheme, palette?: SystemPalette) => void
  ) => void;
}
