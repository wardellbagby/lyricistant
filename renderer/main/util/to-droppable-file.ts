export const toDroppableFile = async (file: File & { path?: string }) => {
  return {
    path: file.path ?? file.name,
    type: file.type,
    data: await file.arrayBuffer(),
  };
};
