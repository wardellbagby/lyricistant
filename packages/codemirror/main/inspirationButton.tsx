import {
  Decoration,
  DecorationSet,
  EditorView,
  PluginValue,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from '@codemirror/view';
import { Chip, Fade } from '@mui/material';
import { sample } from 'lodash-es';
import { Dice3 } from 'mdi-material-ui';
import React, { useEffect, useState } from 'react';
import ReactDOMClient, { Root } from 'react-dom/client';

interface InspirationButtonProps {
  showImmediately: boolean;
  onClick: () => void;
}

const InspirationButton = (props: InspirationButtonProps) => {
  const [fadeIn, setFadeIn] = useState(props.showImmediately);
  useEffect(() => {
    setFadeIn(props.showImmediately);
    const handle = setTimeout(() => setFadeIn(true), 15_000);
    return () => clearTimeout(handle);
  }, [props.showImmediately]);

  return (
    <Fade in={fadeIn} timeout={props.showImmediately ? 0 : 5_000}>
      <Chip
        onClick={props.onClick}
        className={'cm-line-widget'}
        icon={<Dice3 />}
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
  public constructor(
    private container: HTMLElement,
    private root: Root,
    private config: InspirationWidgetConfig
  ) {
    super();
  }

  public eq() {
    return false;
  }

  public toDOM() {
    this.root.render(
      <InspirationButton
        {...this.config}
        onClick={() => this.config.onClick(this.container)}
      />
    );

    return this.container;
  }

  public destroy(dom: HTMLElement) {
    super.destroy(dom);
    this.root.render(null);
  }

  public ignoreEvent() {
    return true;
  }
}

const createDecorations = (
  view: EditorView,
  container: HTMLElement,
  root: Root,
  config: InspirationWidgetConfig
) => {
  const lastVisibleLine =
    view.visibleRanges[view.visibleRanges.length - 1]?.to ?? 0;
  const line = view.state.doc.lineAt(lastVisibleLine);
  const lineBlock = view.lineBlockAt(lastVisibleLine);

  if (line && (line.length === 0 || config.showImmediately) && lineBlock) {
    return Decoration.set(
      Decoration.widget({
        widget: new InspirationButtonWidget(container, root, config),
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
  private container = document.createElement('span');
  private root: Root = ReactDOMClient.createRoot(this.container);

  public constructor(private view: EditorView) {
    this.container.style.display = 'inline-flex';
    this.container.style.verticalAlign = 'middle';
    this.container.style.position = 'absolute';
    this.container.style.paddingLeft = '8px';
    this.container.style.paddingRight = '8px';

    import('./inspiration_words.json').then((words) => {
      this.words = words;
      this.decorations = createDecorations(view, this.container, this.root, {
        showImmediately: false,
        onClick: this.onWidgetClick,
      });
    });
  }

  public destroy() {
    this.root.unmount();
    this.container.remove();
  }

  public update(update: ViewUpdate) {
    if (this.words && (update.docChanged || update.viewportChanged)) {
      this.decorations = createDecorations(
        update.view,
        this.container,
        this.root,
        {
          showImmediately: this.hasClickedWidget,
          onClick: this.onWidgetClick,
        }
      );
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
