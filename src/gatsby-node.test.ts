import { onPostBuild, onPreBootstrap } from './gatsby-node';

describe(`gatsby-node`, () => {
  describe(`onPreBootstrap()`, () => {
    it(`should exist`, () => {
      expect(onPreBootstrap).toBeDefined();
    });
  });

  describe(`onPostBuild()`, () => {
    it(`should exist`, () => {
      expect(onPostBuild).toBeDefined();
    });
  });
});
