module.exports = {
  '{README}.md': ['doctoc --maxlevel 3 --notitle'],
  'package.json': ['npm run format-package-json', 'npm run lint-package-json'],
  '.editorconfig': ['prettier --write'],
  LICENSE: ['prettier --write'],
  // Typescript check does not respect per-file scopes.
  '**/*.md': ['markdownlint --ignore charts --ignore content'],
  '**/*.{css,html,json,less,md,mdx,scss,vue,yaml,yml}': ['prettier --write'],
  '**/*.{gql,graphql}': ['prettier --write'],
  '(**/*.{js,jsx,ts,tsx}|!.*.{js,ts})': [
    'import-sort --write',
    'prettier --write',
    'eslint --fix --format=pretty --max-warnings=0',
    'jest --bail --findRelatedTests --maxWorkers=7',
  ],
  // Typescript check does not respect per-file scopes.
  '**/*.ts?(x)': () => 'tsc -p tsconfig.json --noEmit',
  // Gatsby and general source changes do not respect per-file scopes.
  '(gatsby*.js|src/**/*|data/**/*)': () => 'npm run build',
};
