import { Client, ClientOptions } from '@elastic/elasticsearch';
import { GatsbyNode } from 'gatsby';
import chunk from 'lodash.chunk';

import {
  createIndex,
  deleteOrphanIndices,
  getUniqueIndexName,
  moveAlias,
  setSettings,
} from './elastic';
import { pluginPrefix } from './error-utils';
import { GatsbyActivityTimer } from './gatsby-node.types';
import { createPluginConfig, validateOptions } from './pluginOptions';
import { setStatus } from './utils';

/**
 * give back the same thing as this was called with.
 *
 * @param {any} obj what to keep the same
 */
const identity = (obj: any) => obj;

/**
 * Called once Gatsby has initialized itself and is ready to bootstrap your site.
 * @see https://www.gatsbyjs.com/docs/reference/config-files/gatsby-node/#onPostBootstrap
 */
export const onPreBootstrap: GatsbyNode['onPreBootstrap'] = (
  { reporter },
  pluginOptions
) => {
  validateOptions({ reporter }, pluginOptions);
  reporter.verbose(`[${pluginPrefix}] Successfully validated configuration.`);
};

/**
 * The last extension point called after all other parts of the build process are complete.
 *
 * @param graphql
 * @param reporter
 * @param node
 * @param apiKey
 * @param auth
 * @param queries
 * @param chunkSize
 */
export const onPostBuild: GatsbyNode['onPostBuild'] = async (
  { graphql, reporter },
  pluginOptions
) => {
  const { node, apiKey, auth, chunkSize, ...rest } =
    createPluginConfig(pluginOptions);

  let queries = rest.queries;
  const activity: GatsbyActivityTimer = reporter.activityTimer(
    `Indexing to ElasticSearch`
  );
  activity.start();

  const config: ClientOptions = { node: node };
  if (auth) {
    config[`auth`] = auth;
  } else if (apiKey) {
    config[`auth`] = { apiKey: apiKey };
  }
  const client = new Client(config);

  if (typeof queries === `function`) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      alias = await alias(graphql);
    }

    await deleteOrphanIndices(client, alias);

    const newIndex = await getUniqueIndexName(client, alias, activity);
    await createIndex(client, newIndex);
    setStatus(activity, `index '${newIndex}' created`);

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

    return moveAlias(client, newIndex, alias, activity);
  });

  try {
    await Promise.all(jobs);
    setStatus(activity, `done`);
  } catch (error) {
    reporter.panic(`failed to index to ElasticSearch`, error as Error);
  }

  activity.end();
};
