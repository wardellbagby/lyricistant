export const YES_NO_BUTTONS = ['No', 'Yes'];
export interface DialogData {
  tag?: string;
  title: string;
  message?: string;
  buttons?: string[];
  progress?: number;
}
