export interface Times {
  /**
   * The time that has elapsed since Lyricistant has started.
   *
   * Must not be modified by changing the system time.
   */
  elapsed: () => number;
}
