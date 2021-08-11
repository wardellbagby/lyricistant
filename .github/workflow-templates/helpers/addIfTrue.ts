export const ifTrue = <T>(conditional: boolean, ...value: T[]): T[] => {
  if (conditional) {
    return value;
  } else {
    return [];
  }
};
