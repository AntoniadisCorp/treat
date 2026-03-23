module.exports = {
  branches: ['main', { name: 'next', prerelease: 'next' }],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
      },
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          types: [
            { type: 'feat', section: 'Features', hidden: false },
            { type: 'fix', section: 'Bug Fixes', hidden: false },
            { type: 'perf', section: 'Performance', hidden: false },
            { type: 'revert', section: 'Reverts', hidden: false },
            { type: 'docs', section: 'Documentation', hidden: false },
            { type: 'refactor', section: 'Refactoring', hidden: false },
            { type: 'test', section: 'Tests', hidden: false },
            { type: 'build', section: 'Build System', hidden: false },
            { type: 'ci', section: 'Continuous Integration', hidden: false },
            { type: 'chore', section: 'Maintenance', hidden: false },
          ],
        },
      },
    ],
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: false,
      },
    ],
    '@semantic-release/github',
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'package.json', 'bun.lockb'],
        message:
          'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
  ],
};
