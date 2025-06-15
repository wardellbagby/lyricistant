import type { HistoryDataV1 } from '@lyricistant/common-platform/history/FileHistory';
import {
  HistoryData,
  Change,
  VersionedExtensionData,
  FileDataExtensionKey,
} from './FileDataExtension';

// This file contains various extension related functions to enforce types.

export const isChange = (obj: unknown): obj is Change =>
  ((obj !== null && typeof obj === 'object') || typeof obj === 'function') &&
  'type' in obj &&
  (obj.type === -1 || obj.type === 0 || obj.type === 1) &&
  'line' in obj &&
  typeof obj.line === 'number' &&
  'value' in obj &&
  (typeof obj.value === 'string' || typeof obj.value === 'undefined');

export const isHistoryData = (obj: unknown): obj is HistoryData =>
  ((obj !== null && typeof obj === 'object') || typeof obj === 'function') &&
  'time' in obj &&
  typeof obj.time === 'string' &&
  'changes' in obj &&
  Array.isArray(obj.changes) &&
  obj.changes.every((e: unknown) => isChange(e) as boolean);

export const isHistoryDataV1 = (obj: unknown): obj is HistoryDataV1 =>
  ((obj !== null && typeof obj === 'object') || typeof obj === 'function') &&
  'time' in obj &&
  typeof obj.time === 'string' &&
  'patches' in obj &&
  Array.isArray(obj.patches);

export const isVersionedExtensionData = (
  obj: unknown,
): obj is VersionedExtensionData<FileDataExtensionKey> => {
  return (
    ((obj !== null && typeof obj === 'object') || typeof obj === 'function') &&
    'version' in obj &&
    typeof obj['version'] === 'number'
  );
};
