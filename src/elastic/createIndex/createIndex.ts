import { Client } from '@elastic/elasticsearch';

/**
 * creates a new index
 *
 * @param client
 * @param index
 */
export const createIndex = async (
  client: Client,
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  index: any
): Promise<void> => {
  const createConfig = {
    index: index,
  };
  await client.indices.create(createConfig);
};
