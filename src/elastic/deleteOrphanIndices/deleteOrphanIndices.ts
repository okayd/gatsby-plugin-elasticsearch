import { Client } from '@elastic/elasticsearch';

import { getIndicesStartingWith } from '../getIndicesStartingWith/getIndicesStartingWith';

/**
 * delete indices not linked to an alias
 *
 * @param client
 * @param index
 */
export const deleteOrphanIndices = async (
  client: Client,
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  index: any
): Promise<void> => {
  let response;
  try {
    const indices = await getIndicesStartingWith(client, `${index}_`);
    try {
      response = await client.indices.getAlias({ name: index });
      const aliasedIndices = Object.keys(response.body);
      indices.map(async (index: any) => {
        if (!aliasedIndices.includes(index)) {
          await client.indices.delete({ index: index });
        }
      });
    } catch (err) {
      // No aliased index found
      console.warn(err);
    }
  } catch (err) {
    // No existing indices found
    console.warn(err);
  }
};
