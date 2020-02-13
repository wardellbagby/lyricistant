export function getCssColor(variableName: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();
}

export function getCssNumber(variableName: string): number {
  return parseInt(
    getComputedStyle(document.documentElement)
      .getPropertyValue(variableName)
      .trim(),
    10
  );
}
