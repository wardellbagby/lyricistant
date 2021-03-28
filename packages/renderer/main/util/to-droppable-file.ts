export const toDroppableFile = async (file: File & { path?: string }) => ({
  path: file.path ?? file.name,
  type: file.type,
  data: await file.arrayBuffer(),
});
