import { Manager } from './Manager';

export class PreferenceManager extends Manager {
  public register(): void {
    this.rendererDelegate.on('ready-for-events', this.onRendererReady);
  }
  public unregister(): void {
    throw new Error('Method not implemented.');
  }

  private onRendererReady = (): void => {
    this.rendererDelegate.send('prefs-updated', null);
    this.rendererDelegate.send('dark-mode-toggled', null, true);
  };
}
