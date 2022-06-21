import { createPluginConfig } from './createPluginConfig';

describe(`createPluginConfig()`, () => {
  it(`should exist`, () => {
    expect(createPluginConfig).toBeDefined();
  });

  it(`should return expected default "chunkSize" value`, () => {
    const { chunkSize } = createPluginConfig({});

    expect(chunkSize).toEqual(1000);
  });
});
