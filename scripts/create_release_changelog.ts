#!/usr/bin/env -S node -r ./register-ts-node
import { writeFileSync } from 'fs';
import Handlebars from 'handlebars';
import stringify from 'json-stringify-safe';
import standardChangelog, { RawCommit } from 'standard-changelog';
import { version } from '../package.json';

const APP_SCOPES = ['android', 'electron', 'web', 'ios', 'all'] as const;
type App = typeof APP_SCOPES[number];

Handlebars.registerHelper(
  'toJSON',
  (data) => new Handlebars.SafeString(stringify(data))
);

interface CommitGroup {
  title: string;
  commits: Commit[];
}
interface Commit {
  type: string;
  scope?: string;
  subject: string;
}
interface ReleaseData {
  version: string;
  commitGroups: CommitGroup[];
}

const isSupportedCommitType = (commit: RawCommit): boolean =>
  ['feat', 'fix', 'perf'].includes(commit.type);

const getDisplayableCommitType = (commit: RawCommit): string => {
  if (commit.type === 'feat') {
    return 'Features';
  } else if (commit.type === 'fix') {
    return 'Bug Fixes';
  } else if (commit.type === 'perf') {
    return 'Performance Improvements';
  } else if (commit.type === 'revert' || commit.revert) {
    return 'Reverts';
  } else if (commit.type === 'docs') {
    return 'Documentation';
  } else if (commit.type === 'style') {
    return 'Styles';
  } else if (commit.type === 'refactor') {
    return 'Code Refactoring';
  } else if (commit.type === 'test') {
    return 'Tests';
  } else if (commit.type === 'build') {
    return 'Build System';
  } else if (commit.type === 'ci') {
    return 'Continuous Integration';
  } else if (commit.type === 'chore') {
    return 'Chore';
  }
  return 'Other';
};
const createCommitTransformer =
  (includeAllCommits: boolean) =>
  (commit: RawCommit): RawCommit | null => {
    if (!commit.type) {
      return null;
    }

    if (!isSupportedCommitType(commit) && !includeAllCommits) {
      return null;
    }
    return {
      ...commit,
      type: getDisplayableCommitType(commit),
    };
  };
const getReleaseData = async (
  app: App,
  outputUnreleased: boolean
): Promise<ReleaseData> => {
  const stream = standardChangelog(
    {
      releaseCount: 0,
      outputUnreleased,
      context: outputUnreleased && {
        release: version,
      },
    },
    null,
    null,
    null,
    {
      mainTemplate: '{{toJSON @root}}',
      transform: createCommitTransformer(outputUnreleased),
    }
  );

  for await (const chunk of stream) {
    const release: ReleaseData = JSON.parse(Buffer.from(chunk).toString());
    const isReleaseApplicable = release.commitGroups.some((group) =>
      isCommitGroupApplicable(app, group)
    );
    if (isReleaseApplicable) {
      return release;
    }
  }

  console.error(
    `Unable to find any releases that have commits valid for ${app}`
  );
  process.exit(1);
};

const isCommitApplicable = (app: App, commit: Commit): boolean =>
  app === 'all' || !commit.scope || commit.scope === app;

const isCommitGroupApplicable = (app: App, group: CommitGroup): boolean => {
  const hasApplicableCommits = group.commits.some((commit) =>
    isCommitApplicable(app, commit)
  );

  if (app === 'all') {
    return hasApplicableCommits;
  }

  return hasApplicableCommits && group.title !== 'Build System';
};

const getPrefixFromScope = (scope: string) => {
  if (scope === 'android') {
    return 'Android only';
  }
  if (scope === 'ios') {
    return 'iOS only';
  }
  if (scope === 'electron') {
    return 'Desktop only';
  }
  if (scope === 'web') {
    return 'Web only';
  }

  return null;
};
const formatCommit = (app: App, commit: Commit): string => {
  const prefix = getPrefixFromScope(commit.scope);
  if (prefix) {
    return `- (${prefix}) ${commit.subject}`;
  }
  return `- ${commit.subject}`;
};

const formatCommitGroup = (
  app: App,
  group: CommitGroup,
  maxLength: number
): { value: string; isComplete: boolean } => {
  const header = `${group.title}\n`;
  let isComplete = true;

  const commits = group.commits
    .filter((commit) => isCommitApplicable(app, commit))
    .map((commit) => formatCommit(app, commit))
    .reduce<string>((total, commit) => {
      if (total.length + commit.length + 1 <= maxLength - header.length) {
        return `${total}\n${commit}`;
      } else {
        isComplete = false;
      }
      return total;
    }, '');

  if (commits.length === 0) {
    return null;
  }
  return { value: header + commits, isComplete };
};

const getMaxLength = (app: App): number => {
  if (app === 'android' || app === 'ios') {
    return 500;
  }
  // Chosen arbitrarily but feels pretty long.
  return 10000;
};

const formatRelease = (app: App, data: ReleaseData): string => {
  let isChangelogTooBig = false;
  const changelogTooBigFooter = '\n\nAnd more!';
  let availableLength = getMaxLength(app) - changelogTooBigFooter.length;

  let result = '';

  const groupFooter = '\n\n';
  data.commitGroups
    .filter((group) => isCommitGroupApplicable(app, group))
    .sort((a, b) => {
      if (a.title === 'Features' || a.title === 'Bug Fixes') {
        return -1;
      }

      if (b.title === 'Features' || b.title === 'Bug Fixes') {
        return 1;
      }

      return 0;
    })
    .forEach((group) => {
      const formatResult = formatCommitGroup(app, group, availableLength);
      if (formatResult) {
        result = result + formatResult.value + groupFooter;
        availableLength =
          availableLength - formatResult.value.length - groupFooter.length;
        isChangelogTooBig = !formatResult.isComplete;
      } else {
        isChangelogTooBig = true;
      }
    });

  if (isChangelogTooBig) {
    return result.trim() + changelogTooBigFooter;
  }

  return result.trim();
};

(async () => {
  const app = process.argv[2] as App;
  const output = process.argv[3];
  const outputUnreleased = process.argv[4] === 'unreleased';

  if (!APP_SCOPES.includes(app)) {
    console.error(`"${app}" is not a supported Lyricistant app.`);
    process.exit(1);
  }
  if (!output) {
    console.error('No output directory given.');
  }

  const releaseData = await getReleaseData(app, outputUnreleased);
  const changelog = formatRelease(app, releaseData).trim();
  console.log(changelog);
  writeFileSync(output, changelog);
})();
