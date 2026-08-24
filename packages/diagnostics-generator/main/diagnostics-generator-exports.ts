import { generateDiagnostics } from '@lyricistant/diagnostics-generator/diagnostics-generator';
import { expose } from 'comlink';

// Separate the usage of Comlink from the diagnostics-generator itself for easier testing.
expose({
  generateDiagnostics,
});
