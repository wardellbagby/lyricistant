export const toDroppableFile = async (file: File) => {
  return {
    path: file.path ?? file.name,
    type: file.type,
    data: await file.arrayBuffer(),
  };
};
