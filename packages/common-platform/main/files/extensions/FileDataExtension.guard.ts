import type { HistoryDataV1 } from '@lyricistant/common-platform/history/FileHistory';
import {
  HistoryData,
  Change,
  VersionedExtensionData,
} from './FileDataExtension';

// This file contains various extension related functions to enforce types.

export const isChange = (obj: any): obj is Change =>
  ((obj !== null && typeof obj === 'object') || typeof obj === 'function') &&
  (obj.type === -1 || obj.type === 0 || obj.type === 1) &&
  typeof obj.line === 'number' &&
  (typeof obj.value === 'string' || typeof obj.value === 'undefined');

export const isHistoryData = (obj: any): obj is HistoryData =>
  ((obj !== null && typeof obj === 'object') || typeof obj === 'function') &&
  typeof obj.time === 'string' &&
  Array.isArray(obj.changes) &&
  obj.changes.every((e: any) => isChange(e) as boolean);

export const isHistoryDataV1 = (obj: any): obj is HistoryDataV1 =>
  ((obj !== null && typeof obj === 'object') || typeof obj === 'function') &&
  typeof obj.time === 'string' &&
  Array.isArray(obj.patches);

export const isVersionedExtensionData = (
  obj: any
): obj is VersionedExtensionData<any> =>
  ((obj !== null && typeof obj === 'object') || typeof obj === 'function') &&
  typeof obj.version === 'number';
