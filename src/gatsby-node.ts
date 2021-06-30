import { Client } from '@elastic/elasticsearch';
import chunk from 'lodash.chunk';

import { GatsbyActivityTimer } from './gatsby-node.types';

let activity: GatsbyActivityTimer;

/**
 * hotfix the Gatsby reporter to allow setting status (not supported everywhere)
 *
 * @param {Object} activity reporter
 * @param {String} status status to report
 */
function setStatus(activity: GatsbyActivityTimer | undefined, status: string) {
  if (activity && activity.setStatus) {
    activity.setStatus(status);
  } else {
    console.log(`ElasticSearch:`, status);
  }
}

/**
 * give back the same thing as this was called with.
 *
 * @param {any} obj what to keep the same
 */
const identity = (obj: any) => obj;

/**
 * moves the alias to the target index, delete previously aliased index
 *
 * @param client
 * @param targetIndex
 * @param alias
 */
async function moveAlias(client: any, targetIndex: any, alias: any) {
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
}

/**
 * get indices starting with basename
 *
 * @param client
 * @param basename
 */
async function getIndicesStartingWith(client: any, basename: any) {
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
}

/**
 * returns a unique index name
 *
 * @param client
 * @param index
 */
async function getUniqueIndexName(client: any, basename: string) {
  const indices = await getIndicesStartingWith(client, `${basename}_`);

  const max_suffix = indices.reduce((acc: any, indexName: string) => {
    const parts = indexName.split(`_`);
    const current_index = Number(parts[parts.length - 1]);

    return Math.max(acc, current_index);
  }, 0);

  indices.length &&
    setStatus(activity, `indices [${indices.join()}]  already exists`);

  return `${basename}_${max_suffix + 1}`;
}

/**
 * delete indices not linked to an alias
 *
 * @param client
 * @param index
 */
async function deleteOrphanIndices(client: any, index: any) {
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
}

/**
 * creates a new index
 *
 * @param client
 * @param index
 */
async function createIndex(client: any, index: any) {
  const createConfig = {
    index: index,
  };
  await client.indices.create(createConfig);
  setStatus(activity, `index '${index}' created`);
}

/**
 * apply settings and mappings to the index if any
 *
 * @param client
 * @param index
 * @param indexConfig
 */
async function setSettings(client: any, index: any, indexConfig: any) {
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
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const onPostBuild: Promise<void> = async (
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  { graphql, reporter },
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  { node, apiKey, auth, queries, chunkSize = 1000 }
) => {
  activity = reporter.activityTimer(`Indexing to ElasticSearch`);
  activity.start();

  const config = { node: node };
  if (auth) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    config[`auth`] = auth;
  } else if (apiKey) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    config[`auth`] = { apiKey: apiKey };
  }
  const client = new Client(config);

  if (typeof queries === `function`) {
    queries = await Promise.all(await queries(graphql));
  }

  setStatus(activity, `${queries.length} queries to index`);

  const jobs = queries.map(async function doQuery(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    { indexName: alias, query, transformer = identity, indexConfig },
    i: any
  ) {
    if (!query) {
      reporter.panic(
        `failed to index to Elasticsearch. You did not give "query" to this query`
      );
    }

    if (typeof query === `function`) {
      query = await query(graphql);
    }
    if (typeof alias === `function`) {
      alias = await alias(graphql);
    }

    await deleteOrphanIndices(client, alias);

    const newIndex = await getUniqueIndexName(client, alias);
    await createIndex(client, newIndex);
    if (indexConfig) {
      await setSettings(client, newIndex, indexConfig);
    }

    setStatus(activity, `query ${i}: executing query`);
    const result = await graphql(query);
    if (result.errors) {
      reporter.panic(`failed to index to ElasticSearch`, result.errors);
    }
    const objects = await transformer(result);
    const chunks = chunk(objects, chunkSize);

    setStatus(activity, `query ${i}: splitting in ${chunks.length} jobs`);
    const errors = [];
    for (const chunk of chunks) {
      const body = chunk.flatMap(doc => [{ index: { _index: newIndex } }, doc]);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const bulkResult = await client.bulk({
        index: newIndex,
        type: `_doc`,
        refresh: true,
        body: body,
      });
      if (bulkResult.body.errors) {
        const chunkErrors = bulkResult.body.items
          .filter((item: any) => item.index.error)
          .map((item: any) => JSON.stringify(item.index.error));
        errors.push(...chunkErrors);
      }
    }
    const insertedCount = objects.length - errors.length;
    setStatus(
      undefined,
      `inserted ${insertedCount} of ${objects.length} documents in '${alias}'`
    );

    for (const error of errors) {
      reporter.error(error);
    }

    return moveAlias(client, newIndex, alias);
  });

  try {
    await Promise.all(jobs);
    setStatus(activity, `done`);
  } catch (err) {
    reporter.panic(`failed to index to ElasticSearch`, err);
  }

  activity.end();
};
