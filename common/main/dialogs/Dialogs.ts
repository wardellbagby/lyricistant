type DialogResult = 'cancelled' | 'yes' | 'no';
export interface Dialogs {
  showDialog: (message: string) => Promise<DialogResult>;
}
