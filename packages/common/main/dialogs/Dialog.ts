export const YES_NO_BUTTONS = ['No', 'Yes'];
export type DialogData = {
  tag: string;
} & (FullscreenDialogData | AlertDialogData | SelectionDialogData);

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
  textField?: {
    label: string;
    defaultValue?: string;
  };
}

export interface SelectionDialogData {
  type: 'selection';
  title: string;
  message?: string;
  checkbox?: {
    label: string;
  };
  options: string[];
}

export interface DialogInteractionData {
  selectedButton: string;
  selectedOption?: string;
  checkboxes?: {
    [label: string]: boolean;
  };
  textField?: string;
}
