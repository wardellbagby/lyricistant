import { RendererDelegate } from 'common/Delegates';

export abstract class Manager {
  protected rendererDelegate: RendererDelegate;
  constructor(rendererDelegate: RendererDelegate) {
    this.rendererDelegate = rendererDelegate;
  }

  public abstract register(): void;
  public abstract unregister(): void;
}
