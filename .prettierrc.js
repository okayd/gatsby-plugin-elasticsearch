// Some settings automatically inherited from .editorconfig

module.exports = {
  arrowParens: 'avoid',
  printWidth: 80,
  // Why include an unnecessary character at the end of every line? Break the habit (automatically)!
  semi: true,
  singleQuote: true,
  // Trailing commas help with git merging and conflict resolution
  trailingComma: 'es5',
  overrides: [
    {
      files: '.bench',
      options: { parser: 'json' },
    },
    {
      files: '.editorconfig',
      options: { parser: 'yaml' },
    },
    {
      files: 'LICENSE',
      options: { parser: 'markdown' },
    },
  ],
};
