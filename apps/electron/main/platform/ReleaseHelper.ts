import path from 'path';
import { isUnderTest } from '@lyricistant/common/BuildModes';
import { Logger } from '@lyricistant/common/Logger';
import { Octokit, RestEndpointMethodTypes } from '@octokit/rest';
import semver from 'semver';

export interface ReleaseData {
  baseDownloadUrl: string;
  changelog: string;
}

export type GitHubRelease =
  RestEndpointMethodTypes['repos']['listReleases']['response']['data'][0];

export class ReleaseHelper {
  private static readonly LYRICISTANT_REPO = {
    owner: 'wardellbagby',
    repo: 'lyricistant',
  };

  private readonly octokit: Octokit;
  private cachedReleases: GitHubRelease[] = [];

  public constructor(private logger: Logger) {
    this.octokit = new Octokit();
  }

  public getReleaseData = async (
    currentVersion: string
  ): Promise<ReleaseData> => {
    if (isUnderTest) {
      return null;
    }

    this.logger.debug('Checking for new GitHub releases', { currentVersion });
    const releases = await this.getGitHubReleases(currentVersion);

    if (releases.length === 0) {
      return null;
    }

    const newestRelease = releases[0];
    this.logger.debug('Newest available release', {
      tag: newestRelease.tag_name,
    });
    return {
      // Convert to a URL we can append a file name to
      baseDownloadUrl: this.getBaseDownloadUrl(newestRelease),
      changelog: this.getChangelog(releases),
    };
  };

  private getGitHubReleases = async (currentVersion: string) => {
    if (this.cachedReleases.length > 0) {
      this.logger.debug('Returning cached releases', {
        releases: this.cachedReleases,
      });
      return this.cachedReleases;
    }

    try {
      const result = await this.octokit.rest.repos.listReleases(
        ReleaseHelper.LYRICISTANT_REPO
      );

      for (const release of result.data) {
        // latest tag is always a nightly build; don't upgrade to those.
        if (release.tag_name === 'latest') {
          continue;
        }
        if (!this.isReleaseNewerThanCurrent(currentVersion, release)) {
          break;
        }
        if (release.assets.some((asset) => asset.name === 'latest.yml')) {
          this.cachedReleases.push(release);
        }
      }

      return this.cachedReleases;
    } catch (e) {
      this.logger.warn('Failed to load releases', e);
      this.cachedReleases = [];
      return this.cachedReleases;
    }
  };

  private isReleaseNewerThanCurrent = (
    currentVersion: string,
    release: GitHubRelease
  ): boolean => {
    const current = semver.coerce(currentVersion);
    const next = semver.coerce(release.tag_name);
    if (!current || !next) {
      this.logger.warn('Failed to compare versions', {
        current,
        next,
        currentVersionString: currentVersion,
        releaseTag: release.tag_name,
      });
      return false;
    }
    return semver.gt(next, current);
  };

  private getBaseDownloadUrl = (release: GitHubRelease) =>
    /*
     Takes a URL in the form of https://example.com/path/file.txt and converts
     it to https://example.com/path/
    */
    path.dirname(release.assets[0].browser_download_url);

  private getChangelog = (releases: GitHubRelease[]) =>
    releases.reduce(
      (changelog: string, release) =>
        `##${release.name}\n\n${release.body}\n\n${changelog}`,
      ''
    );
}
