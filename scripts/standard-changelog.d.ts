declare module 'standard-changelog' {
  export interface RawCommit {
    type: string;
    revert?: boolean;
    body: string;
    header: string;
  }
  export default function standardChangelog(
    options: {
      releaseCount: number;
      context: { release: string };
      outputUnreleased: boolean;
    },
    arg2: null,
    arg3: null,
    arg4: null,
    writerOptions: {
      transform: (commit: RawCommit) => RawCommit | null;
      mainTemplate: string;
    }
  ): NodeJS.ReadStream;
}
