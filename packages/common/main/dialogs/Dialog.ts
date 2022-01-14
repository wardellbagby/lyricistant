export const YES_NO_BUTTONS = ['No', 'Yes'];
export type DialogData = {
  tag: string;
} & (FullscreenDialogData | AlertDialogData);

export interface FullscreenDialogData {
  type: 'fullscreen';
  message: string;
  progress?: number | 'indeterminate';
  cancelable?: boolean;
}

export interface AlertDialogData {
  type: 'alert';
  title: string;
  message?: string;
  collapsibleMessage?: {
    label: string;
    message: string;
  };
  buttons?: string[];
  progress?: number;
}
