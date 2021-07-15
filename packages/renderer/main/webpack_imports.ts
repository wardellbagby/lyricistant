declare module '*.png' {
  const value: any;
  export = value;
}
declare module '*.svg' {
  const value: React.FC<React.SVGProps<SVGSVGElement>>;
  export default value;
}
