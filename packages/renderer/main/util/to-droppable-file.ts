import { DroppableFile } from '@lyricistant/common/files/Files';

export const toDroppableFile = async (
  file: File & { path?: string }
): Promise<DroppableFile> => ({
  path: file.path ?? file.name,
  type: file.type,
  data: await file.arrayBuffer(),
});
