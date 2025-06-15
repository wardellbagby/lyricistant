import { DateTime, LocaleOptions } from 'luxon';

export interface Clock {
  now: () => Instant;
  fromIso: (isoString: string) => Instant;
}

export interface Instant {
  formatLocal: (options: Intl.DateTimeFormatOptions) => string;
  formatIso: () => string;
}

const createInstant = (
  dateTime: DateTime,
  locale?: LocaleOptions,
  zone?: string,
): Instant => ({
  formatLocal: (option) =>
    dateTime.toLocaleString(
      { ...option, timeZone: zone ?? option.timeZone },
      locale,
    ),
  formatIso: () => dateTime.toISO(),
});

export class RealClock implements Clock {
  public now = (): Instant => createInstant(DateTime.local());
  public fromIso = (isoString: string) =>
    createInstant(DateTime.fromISO(isoString));
}

export class FakeClock implements Clock {
  public now = (): Instant =>
    createInstant(
      DateTime.fromObject(
        {
          month: 7,
          day: 22,
          year: 2029,
          hour: 8,
          minute: 0,
          second: 0,
          millisecond: 0,
        },
        { zone: 'America/Los_Angeles' },
      ),
      {
        locale: 'en-US',
      },
      'America/Los_Angeles',
    );
  public fromIso = (isoString: string) =>
    createInstant(
      DateTime.fromISO(isoString),
      {
        locale: 'en-US',
      },
      'America/Los_Angeles',
    );
}
