import { Client } from '@elastic/elasticsearch';

import { GatsbyActivityTimer } from '../../gatsby-node.types';
import { setStatus } from '../../utils';
import { getIndicesStartingWith } from '../getIndicesStartingWith/getIndicesStartingWith';

/**
 * returns a unique index name
 *
 * @param client
 * @param index
 */
export const getUniqueIndexName = async (
  client: Client,
  basename: string,
  activity: GatsbyActivityTimer | undefined
): Promise<string> => {
  const indices = await getIndicesStartingWith(client, `${basename}_`);

  const max_suffix = indices.reduce((acc: any, indexName: string) => {
    const parts = indexName.split(`_`);
    const current_index = Number(parts[parts.length - 1]);

    return Math.max(acc, current_index);
  }, 0);

  indices.length &&
    setStatus(activity, `indices [${indices.join()}]  already exists`);

  return `${basename}_${max_suffix + 1}`;
};
