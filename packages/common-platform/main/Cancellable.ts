/**
 * Represents an object that can be used to determine whether an action has been cancelled.
 *
 * Actions can be cancelled via an instance of {@link Cancellable}.
 */
export interface CancelSignal {
  isCancelled: boolean;
  addOnCancelListener: (onCancel: () => void) => void;
}

export class CancelError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'CancelError';
  }
}

/**
 * An implementation of a cancel signal.
 *
 * {@link CancelSignalImpl.cancel} is only made public to be used by
 * {@link Cancellable}; we don't want things using a {@link CancelSignal} to
 * cancel themselves like this.
 */
class CancelSignalImpl implements CancelSignal {
  public isCancelled = false;
  private listeners: Array<() => void> = [];

  public addOnCancelListener = (onCancel: () => void) => {
    if (this.isCancelled) {
      onCancel();
      return;
    }
    this.listeners.push(onCancel);
  };
  public cancel = () => {
    this.isCancelled = true;
    this.listeners.forEach((listener) => listener());
    this.listeners = [];
  };
}

/**
 * Cancellable represents a controller object that allows you to abort one or
 * more requests as desired, so long as all the requests use the same
 * {@link Cancellable.signal}.
 */
export class Cancellable {
  public readonly signal: CancelSignal = new CancelSignalImpl();

  public cancel = () => (this.signal as CancelSignalImpl).cancel();
}

/**
 * Takes a promise and makes it cancellable by way of a {@link CancelSignal}
 *
 * If the signal prompts a cancellation, the promise will be rejected.
 * Otherwise, it will resolve or reject normally.
 *
 * @param promise The promise to make cancellable.
 * @param signal The CancelSignal to invoke cancellation.
 */
export const makeCancellable = <T>(
  promise: Promise<T>,
  signal: CancelSignal
) => {
  if (!promise || !(promise instanceof Promise)) {
    throw new Error('Invalid promise');
  }
  return new Promise<T>(async (resolve, reject) => {
    signal.addOnCancelListener(() =>
      reject(new CancelError('Promise cancelled'))
    );

    promise.then(resolve, reject).catch(reject);
  });
};
