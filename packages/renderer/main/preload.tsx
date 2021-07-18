import { getThemePalette } from '@lyricistant/renderer/theme';
import jss, { Styles } from 'jss';
import camelCase from 'jss-plugin-camel-case';
import nested from 'jss-plugin-nested';
import feather from './lyricistant_feather.svg';

jss.use(camelCase(), nested());

const theme = getThemePalette(true);

const rootStyles: Styles = {
  '@keyframes loading': {
    '0%': {
      fill: theme.primary,
    },
    '100%': {
      fill: theme.surface,
    },
  },
  overlay: {
    opacity: 1,
    backgroundColor: theme.background,
    color: theme.primaryText,
    transition: 'opacity 500ms linear, background-color 500ms;',
    height: '100%',
    width: '100%',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    position: 'fixed',
    overscrollBehavior: 'none',
    zIndex: '999',
    '& #feather': {
      animationDuration: '2s',
      animationFillMode: 'forwards',
      animationIterationCount: 'infinite',
      animationName: '$loading',
      animationTimingFunction: 'ease-in-out',
      animationDirection: 'alternate'
    },
  },
};

const {
  classes: { overlay },
} = jss.createStyleSheet(rootStyles).attach();

let container = document.getElementById('preload-overlay');

if (!container) {
  container = document.createElement('div');
  container.className = overlay;
  container.id = 'preload-overlay';
  document.body.append(container);

  container.innerHTML = feather;
  const image = container.firstElementChild as SVGSVGElement;
  image.style.width = '128px';
  image.style.height = '128px';
  image.id = 'feather';
}

export const onPageLoaded = () => {
  container.style.opacity = '0';
  setTimeout(() => {
    container.remove();
    container = null;
  }, 500);
};

export const onThemeUpdated = (background: string) => {
  if (container) {
    container.style.backgroundColor = background;
  }
};
