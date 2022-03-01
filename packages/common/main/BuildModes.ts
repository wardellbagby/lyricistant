export const isDevelopment = process.env.NODE_ENV === 'development';
/**
 * Whether Lyricistant is currently being run in a test capacity.
 *
 * Use this with major caution; whenever possible, don't gate logic depending
 * on this value. This is meant for situations where we absolutely have to have
 * different logic when under test (for instance, Electron has to have node
 * integration enabled), but there's no way of providing that logic differently
 * for test builds.
 *
 * Instead, use dependency injection for platform logic and....we don't have a
 * good solution for renderer logic yet, but we're working on it.
 */
export const isUnderTest = !!process.env.IS_UNDER_TEST;
