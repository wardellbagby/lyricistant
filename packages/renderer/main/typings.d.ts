declare module '*.png' {
  const value: unknown;
  export = value;
}
declare module '*.css' {
  const value: unknown;
  export = value;
}
declare module '*.svg' {
  const value: string;
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  export default value;
}

declare module '*.dic' {
  const value: Uint8Array;
  export default value;
}

declare module '*.aff' {
  const value: Uint8Array;
  export default value;
}

declare module 'retext-usage' {
  export default function retextUsage(): import('unified').Transformer<
    import('nlcst').Root,
    import('nlcst').Root
  >;
}
