import type { NodeOptions } from '@elastic/elasticsearch';
import type { BasicAuth } from '@elastic/elasticsearch/lib/pool';

import { DefaultOptions } from '../';

export interface ElasticsearchQuery {
  /** the target index name */
  indexName: string;
  /** optional, any index settings or mappings **/
  indexConfig?: any;
  /** GraphQL query **/
  query: any;
  /** optional, transformer **/
  transformer?: () => any;
}

export interface PluginConfig extends DefaultOptions {
  /** the Elasticsearch Node service endpoint */
  node: string | string[] | NodeOptions | NodeOptions[];
  /** the IDR solution service endpoint */
  queries: ElasticsearchQuery[];
  /** optional elastic api key */
  apiKey?: string;
  /** optional, Elasticsearch basic auth configuration object */
  auth?: BasicAuth;
  /** raw plugin options from Gatsby */
  getOriginalPluginOptions: () => any;
}
