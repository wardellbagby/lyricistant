import { RendererDelegate } from 'common/Delegates';

export abstract class Manager {
  protected rendererDelegate: RendererDelegate;

  constructor(rendererDelegate: RendererDelegate) {
    if (!rendererDelegate) {
      throw Error('RendererDelegate cannot be null.');
    }
    this.rendererDelegate = rendererDelegate;
  }

  public abstract register(): void;
}
