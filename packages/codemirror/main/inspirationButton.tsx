import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
  PluginValue,
} from '@codemirror/view';
import { Chip, Fade } from '@mui/material';
import { sample } from 'lodash-es';
import { AutoFix } from 'mdi-material-ui';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

interface InspirationButtonProps {
  showImmediately: boolean;
  onClick: () => void;
}
const InspirationButton = (props: InspirationButtonProps) => {
  const [fadeIn, setFadeIn] = useState(props.showImmediately);
  useEffect(() => {
    const handle = setTimeout(() => setFadeIn(true), 15_000);
    return () => clearTimeout(handle);
  }, null);

  return (
    <Fade in={fadeIn} timeout={props.showImmediately ? 0 : 5_000}>
      <Chip
        onClick={props.onClick}
        className={'cm-line-widget'}
        icon={<AutoFix />}
        label={props.showImmediately ? 'Again?' : 'Inspire?'}
        variant={'outlined'}
        size={'small'}
      />
    </Fade>
  );
};

interface InspirationWidgetConfig
  extends Omit<InspirationButtonProps, 'onClick'> {
  onClick: (target: HTMLElement) => void;
}
class InspirationButtonWidget extends WidgetType {
  public constructor(private config: InspirationWidgetConfig) {
    super();
  }

  public eq() {
    return false;
  }

  public toDOM() {
    const root = document.createElement('span');
    root.style.display = 'inline-flex';
    root.style.verticalAlign = 'middle';
    root.style.position = 'absolute';
    root.style.paddingLeft = '8px';
    root.style.paddingRight = '8px';

    ReactDOM.render(
      <InspirationButton
        {...this.config}
        onClick={() => this.config.onClick(root)}
      />,
      root
    );

    return root;
  }

  public ignoreEvent() {
    return true;
  }

  public destroy(dom: HTMLElement) {
    super.destroy(dom);
    ReactDOM.unmountComponentAtNode(dom);
  }
}

const createDecorations = (
  view: EditorView,
  config: InspirationWidgetConfig
) => {
  const lastVisibleLine =
    view.visibleRanges[view.visibleRanges.length - 1]?.to ?? 0;
  const line = view.state.doc.lineAt(lastVisibleLine);
  const lineBlock = view.lineBlockAt(lastVisibleLine);

  if (line && (line.length === 0 || config.showImmediately) && lineBlock) {
    return Decoration.set(
      Decoration.widget({
        widget: new InspirationButtonWidget(config),
        side: 1,
      }).range(line.to)
    );
  }
  return Decoration.none;
};

class InspirationButtonPlugin implements PluginValue {
  public decorations: DecorationSet = Decoration.none;
  private words: string[];
  private hasClickedWidget = false;

  public constructor(private view: EditorView) {
    import('./inspiration_words.json').then((words) => {
      this.words = words;
      this.decorations = createDecorations(view, {
        showImmediately: false,
        onClick: this.onWidgetClick,
      });
    });
  }

  public update(update: ViewUpdate) {
    if (this.words && (update.docChanged || update.viewportChanged)) {
      this.decorations = createDecorations(update.view, {
        showImmediately: this.hasClickedWidget,
        onClick: this.onWidgetClick,
      });
      this.hasClickedWidget = false;
    }
  }

  private onWidgetClick = (target: HTMLElement) => {
    const insert = sample(this.words);
    const line = this.view.state.doc.lineAt(this.view.posAtDOM(target));

    this.hasClickedWidget = true;
    this.view.dispatch({
      changes: {
        from: line.from,
        to: line.to,
        insert,
      },
      selection: {
        anchor: line.from + insert.length,
      },
    });
  };
}

export const inspirationButton = () =>
  ViewPlugin.define((view) => new InspirationButtonPlugin(view), {
    decorations: (plugin) => plugin.decorations,
  });
