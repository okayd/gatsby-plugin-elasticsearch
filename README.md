# Gatsby plugin ElasticSearch

> Important: This is a fork of [@logilab/gatsby-plugin-elasticsearch hosted on GitLab](https://gitlab.com/logilab/gatsby-plugin-elasticsearch/). 

To share functionality with the original open-source project, try to implement features generically. You should set `@logilab/gatsby-plugin-elasticsearch` as an upstream remote in git.

```shell
git remote add upstream @logilab/gatsby-plugin-elasticsearch
```

Feature branches should be ideally be branched from the upstream repo's `master` branch so that the code can be shared. That work can then be `cherry-picked` into a new feature branch derived from `main`, which will be used for a PR within the Okayd infrastructure.

Ideally, this fork of `gatsby-plugin-elasticsearch` will not be needed for the long term. Time will tell...

---

> This plugin is mostly inspired by [gatsby-plugin-algolia](https://github.com/algolia/gatsby-plugin-algolia)

You can specify a list of queries to run and how to transform them into an array of objects to index. When you run `gatsby build`, it will publish those to your Elasticsearch node.

Here we have an example with some data that might not be very relevant, but will work with the default configuration of `gatsby new`

```shell
$ yarn add gatsby-plugin-elasticsearch
```

Just pass a plain graphql query to fetch nodes, each one will create a document:

```js
// gatsby-config.js

const myQuery = `{
  allSitePage {
    edges {
      node {
        path
        internal {
          type
          contentDigest
          owner
        }
      }
    }
  }
}`;

const queries = [
  {
    query: myQuery,
    transformer: ({ data }) => data.allSitePage.edges.map(({ node }) => node), // optional
    indexName: 'pages', //
    indexConfig: {
      // optional, any index settings or mappings
      mappings,
      settings,
    },
  },
];

module.exports = {
  plugins: [
    {
      resolve: `gatsby-plugin-elasticsearch`,
      options: {
        node: 'http://localhost:9200',
        apiKey: process.env.ES_API_KEY, // optional
        queries,
        chunkSize: 10000, // default: 1000
      },
    },
  ],
};
```

The `queries` field also accepts a function which takes graphql as argument and should be async. It has to return an array of queries.

This let you create a query factory to get dynamic queries based on your existing data:

```js
// gatsby-config.js

const pathsQuery = `{
  allSitePage {
    edges {
      node {
        path
      }
    }
  }
}`;

function queryFormatter(min, max) {
  return `
    allSitePage(
      filter: {
        path: {regex: "/^.{${min},${max}}$/"}
      }
    ) {
      edges {
        node {
          path
          internal {
            type
            contentDigest
            owner
          }
        }
      }
    }
  `;
}

// Your queryFactory gets graphql as argument
async function myQueryFactory(graphql) => {
  const paths = await graphql(pathsQuery).data.allSitePage.map(({ node }) => node.path);

  const maxLength = Math.max.apply(Math, paths.map(function(p) { return p.length; }))
  const middleLength = Integer(maxLength/2);

  const categories = [
    {
      name: 'short_path',
      query: queryFormatter(0, middleLength),
    },
    {
      name: 'long_paths',
      query: queryFormatter(middleLength+1, max_length);
    }
  ];

  return categories.map(category => ({
    query: category.query, // dynamic query
    transformer: ({ data }) => data.allSitePage.edges.map(({ node }) => node), // optional
    indexName: category.name, // dynamic index
    indexConfig: {
      // optional, any index settings or mappings
      mappings,
      settings,
    },
  }));
}

module.exports = {
  plugins: [
    {
      resolve: `gatsby-plugin-elasticsearch`,
      options: {
        node: 'http://localhost:9200',
        apiKey: process.env.ES_API_KEY, // optional
        queries: myQueryFactory,
        chunkSize: 10000, // default: 1000
      },
    },
  ],
};
```

The `transformer` field accepts a function and optionally you may provide an `async` function.

The index will be synchronised with the provided index name on your Elasticsearch node on the `build` step in Gatsby.

# Feedback

Feel free to open issues or PR to improve it!
