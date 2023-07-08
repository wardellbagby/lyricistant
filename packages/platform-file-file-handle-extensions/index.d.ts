import '@lyricistant/common/files/PlatformFile';

declare module '@lyricistant/common/files/PlatformFile' {
  export interface PlatformFile {
    extras?: {
      /**
       * When running on Web on a browser that supports file system handles,
       * this will be the handle for a file that was dragged-and-dropped.
       */
      handle?: FileSystemFileHandle;
    };
  }
}
