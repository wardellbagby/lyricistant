import { Runners } from '@wardellbagby/gh-workflow-gen';

/** The GitHub Actions runner that should be used by the vast majority of actions. */
export const defaultRunner: Runners = 'ubuntu-22.04';

/**
 * The GitHub Actions runner that should be used when a Job has a dependency on
 * macOS. E.g., has to build the iOS app or has to build the macOS flavor of the
 * Electron app.
 */
export const defaultMacOsRunner: Runners = 'macos-13';
