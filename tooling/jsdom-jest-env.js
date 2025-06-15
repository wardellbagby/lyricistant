const { TestEnvironment } = require('jest-environment-jsdom');

class Worker {
  constructor() {}
  postMessage() {}
}

module.exports = class CustomTestEnvironment extends TestEnvironment {
  async setup() {
    await super.setup();
    if (typeof this.global.TextEncoder === 'undefined') {
      // JSDom doesn't have TextEncoders so use Node's.
      const { TextEncoder, TextDecoder } = require('util');
      this.global.TextEncoder = TextEncoder;
      this.global.TextDecoder = TextDecoder;
    }

    if (typeof this.global.Worker === 'undefined') {
      // JSDom doesn't support Workers, so just use an empty one.
      this.global.Worker = Worker;
    }

    if (typeof this.global.Blob.prototype.arrayBuffer === 'undefined') {
      // JSDom doesn't have ArrayBuffer so recreate it here.
      this.global.Blob.prototype.arrayBuffer = async function () {
        return new Uint8Array(
          this[Object.getOwnPropertySymbols(this)[0]]._buffer,
        );
      };
    }

    if (typeof this.global.ResizeObserver === 'undefined') {
      // JSDom doesn't include ResizeObserver, so use a polyfill
      this.global.ResizeObserver = (
        await import('resize-observer-polyfill')
      ).default;
    }

    if (
      typeof this.global.Range.prototype.getBoundingClientRect === 'undefined'
    ) {
      // CodeMirror uses this heavily and again, JSDom doesn't support it so we
      // make our own mocked version.
      this.global.Range.prototype.getBoundingClientRect = () => ({
        bottom: 0,
        height: 0,
        left: 0,
        right: 0,
        top: 0,
        width: 0,
      });
      this.global.Range.prototype.getClientRects = () => ({
        item: () => null,
        length: 0,
        [Symbol.iterator]: [][Symbol.iterator],
      });
    }
  }
};
