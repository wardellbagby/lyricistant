import { DEPLOY_GH_PAGES } from './versions';
import { Step } from './Workflow';

export const deployWeb = (
  site: 'lyricistant.app' | 'dev.lyricistant.app'
): Step => ({
  name: 'Deploy Web',
  uses: DEPLOY_GH_PAGES,
  with: {
    personal_token: '${{ secrets.LYRICISTANT_TOKEN }}',
    publish_branch: 'gh-pages',
    publish_dir: 'apps/web/dist/production/',
    force_orphan: true,
    cname: site,
    external_repository:
      site === 'lyricistant.app'
        ? 'wardellbagby/lyricistant-website'
        : undefined,
  },
});
