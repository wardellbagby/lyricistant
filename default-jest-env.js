/* eslint-disable @typescript-eslint/no-empty-function */
const Environment = require('jest-environment-jsdom');

class Worker {
  constructor() {}
  postMessage() {}
}

module.exports = class CustomTestEnvironment extends Environment {
  async setup() {
    await super.setup();
    if (typeof this.global.TextEncoder === 'undefined') {
      const { TextEncoder, TextDecoder } = require('util');
      this.global.TextEncoder = TextEncoder;
      this.global.TextDecoder = TextDecoder;
    }
    if (typeof this.global.Worker === 'undefined') {
      this.global.Worker = Worker;
    }
  }
};
