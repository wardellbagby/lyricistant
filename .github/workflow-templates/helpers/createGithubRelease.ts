import { Step } from './Workflow';
import { AUTOMATIC_RELEASES } from './versions';

type Options = {
  nightly: boolean;
  files: string;
};
export const createGithubRelease = ({ nightly = false, files }: Options): Step => ({
  name: `Create ${nightly ? 'Nightly ' : ''}Github release`,
  uses: AUTOMATIC_RELEASES,
  with: {
    repo_token: '${{ secrets.GITHUB_TOKEN }}',
    automatic_release_tag: nightly ? 'latest' : undefined,
    prerelease: nightly,
    title: nightly ? 'Lyricistant - Nightly' : undefined,
    files,
  },
});
