import { Step } from './Workflow';
import { AUTOMATIC_RELEASES, AUTOMATIC_RELEASES_ALT } from './versions';

interface Options {
  nightly?: boolean;
  files: string;
}
export const createGithubRelease = (options: Options): Step => {
  const { nightly, files } = { nightly: false, ...options };
  return {
    name: `Create ${nightly ? 'Nightly ' : ''}Github release`,
    uses: AUTOMATIC_RELEASES,
    with: {
      repo_token: '${{ secrets.GITHUB_TOKEN }}',
      automatic_release_tag: nightly ? 'latest' : undefined,
      prerelease: nightly,
      title: nightly ? 'Lyricistant - Nightly' : undefined,
      files,
    },
  };
};

interface OptionsAlt {
  files: string;
  bodyPath: string;
}
export const createGithubReleaseAlt = (options: OptionsAlt): Step => {
  const { files, bodyPath } = options;
  return {
    name: 'Create Github release',
    uses: AUTOMATIC_RELEASES_ALT,
    with: {
      token: '${{ secrets.GITHUB_TOKEN }}',
      body_path: bodyPath,
      files,
    },
  };
};
