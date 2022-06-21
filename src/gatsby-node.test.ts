import { onPostBuild } from './gatsby-node';

describe(`gatsby-node`, () => {
  describe(`onPostBuild()`, () => {
    it(`should exist`, () => {
      expect(onPostBuild).toBeDefined();
    });
  });
});
