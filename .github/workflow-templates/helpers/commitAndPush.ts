export const commitAndPush = (message: string): string =>
  `git diff --quiet && git diff --staged --quiet || (git commit --all -m "${message}" && git push)`;
