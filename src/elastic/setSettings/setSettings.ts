import { Client } from '@elastic/elasticsearch';

/**
 * apply settings and mappings to the index if any
 *
 * @param client
 * @param index
 * @param indexConfig
 */
export const setSettings = async (
  client: Client,
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  index: any,
  indexConfig: { mappings: any; settings: any }
): Promise<void> => {
  const { mappings, settings } = indexConfig;

  if (settings) {
    await client.indices.close({
      index: index,
    });
    await client.indices.putSettings({
      index: index,
      body: { settings: settings },
    });
    await client.indices.open({
      index: index,
    });
  }

  mappings &&
    (await client.indices.putMapping({
      index: index,
      body: { ...mappings },
    }));
};
