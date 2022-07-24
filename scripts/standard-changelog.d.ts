declare module 'standard-changelog' {
  export default function standardChangelog(
    options: {
      releaseCount: number;
    },
    arg2: null,
    arg3: null,
    arg4: null,
    writerOptions: {
      mainTemplate: string;
    }
  ): NodeJS.ReadStream;
}
