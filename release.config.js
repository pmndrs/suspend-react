module.exports = {
  branches: ['main'],
  plugins: [
    // https://github.com/semantic-release/semantic-release/blob/master/docs/extending/plugins-list.md
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/github',
    [
      '@semantic-release/npm',
      {
        pkgRoot: './dist',
      },
    ],
  ],
}
