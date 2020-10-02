declare namespace WebDriver {
  interface Client {
    elementSendKeys(elementId: string, value: string): void;
  }
}
