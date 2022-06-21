import { Client } from '@elastic/elasticsearch';

import { GatsbyActivityTimer } from '../../gatsby-node.types';
import { setStatus } from '../../utils';

/**
 * moves the alias to the target index, delete previously aliased index
 *
 * @param client
 * @param targetIndex
 * @param alias
 */
export const moveAlias = async (
  client: Client,
  targetIndex: string | string[],
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  alias: any,
  activity: GatsbyActivityTimer | undefined
): Promise<void> => {
  try {
    const response = await client.indices.getAlias({ name: alias });
    await Promise.all(
      Object.entries(response.body).map(async ([aliasedIndex]) => {
        setStatus(activity, `deleting index '${aliasedIndex}'`);
        return client.indices.delete({ index: aliasedIndex });
      })
    );
  } catch (error) {
    // No existing alias found
  }

  await client.indices.putAlias({ index: targetIndex, name: alias });
  setStatus(activity, `moved alias '${alias}' -> '${targetIndex}'`);
};
