module.exports = {
  collectCoverageFrom: ['src/**/*.{js,ts}', '!util/**/*.{js,ts}'],
  globals: {
    __PATH_PREFIX__: '',
  },
  testURL: 'http://localhost',
  roots: ['./src'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testPathIgnorePatterns: ['node_modules', 'dist'],
  transformIgnorePatterns: [`node_modules/(?!(gatsby)/)`],
  transform: {
    '^.+\\.[jt]s$': 'ts-jest',
    '\\.xml$': 'jest-raw-loader',
  },
  testMatch: ['**/*.(test|spec).ts'],
  moduleNameMapper: {
    // GatsbyJS 3.0 vendored reach-router to make it work for React 17
    '^@reach/router(.*)': '<rootDir>/node_modules/@gatsbyjs/reach-router$1',
    // Mocks out all these file formats when tests are run
    // ".+\\.(css|styl|less|sass|scss)$": `identity-obj-proxy`,
    // ".+\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": `<rootDir>/src/__mocks__/file-mock.js`,
    // ...paths,
  },
};
