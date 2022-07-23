export type Serializable =
  | boolean
  | number
  | string
  | null
  | Serializable[]
  | { [key: string]: Serializable | undefined };
