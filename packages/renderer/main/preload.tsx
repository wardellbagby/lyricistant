import { Palette } from '@lyricistant/common/theme/SystemTheme';
import logo from '@lyricistant/renderer/lyricistant_logo.svg';
import { getThemePalette } from '@lyricistant/renderer/theme';

onThemeUpdated(getThemePalette().palette);

let container = document.getElementById('preload-overlay');

if (!container) {
  container = document.createElement('div');
  container.id = 'preload-overlay';
  document.body.append(container);

  container.innerHTML = logo;
  const image = container.firstElementChild as SVGSVGElement;
  image.style.width = '128px';
  image.style.height = '128px';
  image.id = 'preload-overlay-logo';
}

export const onPageLoaded = () => {
  if (container) {
    container.style.opacity = '0';
    setTimeout(() => {
      container?.remove();
      container = null;
    }, 500);
  }
};

export function onThemeUpdated(palette: Palette) {
  document.body.style.setProperty('--primary', palette.primary);
  document.body.style.setProperty('--background', palette.background);
  document.body.style.setProperty('--surface', palette.surface);
  document.body.style.setProperty('--text', palette.primaryText);
}
