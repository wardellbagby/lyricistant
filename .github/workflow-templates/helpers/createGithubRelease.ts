import { AUTOMATIC_RELEASES } from './versions';
import { Step } from './Workflow';

interface Options {
  nightly?: boolean;
  files: string;
  bodyPath: string;
}
export const createGithubRelease = (options: Options): Step => {
  const { files, bodyPath, nightly } = { nightly: false, ...options };
  return {
    name: `Create ${nightly ? 'Nightly ' : ''}Github release`,
    uses: AUTOMATIC_RELEASES,
    with: {
      token: '${{ secrets.GITHUB_TOKEN }}',
      body_path: bodyPath,
      files,
      name: nightly ? 'Lyricistant - Nightly' : undefined,
      tag_name: nightly ? 'latest' : undefined,
      prerelease: nightly,
    },
  };
};
