import { Client } from '@elastic/elasticsearch';

/**
 * get indices starting with basename
 *
 * @param client
 * @param basename
 */
export const getIndicesStartingWith = async (
  client: Client,
  basename: string
): Promise<any> => {
  let indices = [];

  try {
    const response = await client.cat.indices({ h: [`index`] });
    indices = response.body
      .split(`\n`)
      .filter((index: any) => index.startsWith(basename));
  } catch (err) {
    // No indices found
  }

  return indices;
};
