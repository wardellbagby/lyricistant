export interface ChunkLine {
  type: 'old' | 'new' | 'context';
  line: string;
}

/** A visual representation of a group of line-based changes to a file. */
export interface Chunk {
  lines: ChunkLine[];
}
export interface ParsedHistoryData {
  time: string;
  text: string;
  chunks: Chunk[];
}
