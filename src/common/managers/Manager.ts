import { RendererDelegate } from 'common/Delegate';

export abstract class Manager {
  protected rendererDelegate: RendererDelegate;
  constructor(rendererDelegate: RendererDelegate) {
    this.rendererDelegate = rendererDelegate;
  }

  public abstract register(): void;
  public abstract unregister(): void;
}
