import { getThemePalette } from '@lyricistant/renderer/util/theme';
import jss, { Styles } from 'jss';
import camelCase from 'jss-plugin-camel-case';

jss.use(camelCase());

const theme = getThemePalette(true);
const dotStyles: Styles = {
  dot: {
    display: 'inline-block',
    backgroundColor: theme.primary,
    width: '30px',
    height: '30px',
    margin: '10px',
    borderRadius: '100%',
    animation: `$animation 1.2s 0s infinite linear`,
    animationFillMode: 'both',
  },
  dotOffset: {
    display: 'inline-block',
    backgroundColor: theme.primary,
    width: '30px',
    height: '30px',
    margin: '10px',
    borderRadius: '100%',
    animation: `$animation 1.2s .60s infinite linear`,
    animationFillMode: 'both',
  },
  '@keyframes animation': {
    '50%': {
      transform: 'scale(.75); opacity: .2',
    },
    '100%': {
      transform: 'scale(1); opacity: 1',
    },
  },
};

const rootStyles: Styles = {
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
  },
};

const {
  classes: { dot, dotOffset },
} = jss.createStyleSheet(dotStyles).attach();
const {
  classes: { overlay },
} = jss.createStyleSheet(rootStyles).attach();

let container = document.getElementById('preload-overlay');

if (!container) {
  container = document.createElement('div');
  container.className = overlay;
  container.id = 'preload-overlay';
  document.body.append(container);

  [0, 0, 0].forEach((_, index) => {
    const dotElement = document.createElement('div');
    dotElement.className = index % 2 ? dot : dotOffset;
    container.append(dotElement);
  });
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
