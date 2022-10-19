'use strict'
import Fastify from 'fastify'
import mercurius from 'mercurius'

/* open browser: http://localhost:5001/
query Q1($name: String!) {
  sp(name: $name) {
    name
    rank
    taxonomy {
      genus
      family
    }
  }
}
variables: {"name":"B xyz"}*/

const taxontree = [
    {
      genus: 'A',
      family: 'fa',
      epithet: 'abc'
    },
    {
      genus: 'A',
      family: 'fa',
      epithet: 'def'
    },
    {
      genus: 'B',
      family: 'fa',
      epithet: 'xyz'
    },
    {
      genus: 'C',
      family: 'fb',
      epithet: 'tuv'
    }
]

const species = {
  'A abc': {
    name: 'A abc',
    rank: 'species',
  },
  'B xyz': {
    name: 'B xyz',
    rank: 'species',
  },
  'A def': {
    name: 'A def',
    rank: 'species',
  },
  'C tuv': {
    name: 'C tuv',
    rank: 'species',
  },
}

const schema = `
    extend type Query {
      sp(name: String!): Taxon
    }
    type Taxonomy {
      genus: String
      family: String
      epithet: String
    }
    type Taxon @key(fields: "name") {
      name: String!
      rank: String
      taxonomy: Taxonomy
    }`

const startService = async () => {
  const service = Fastify({logger: true})

  const resolvers = {
    Query: {
      sp: (root, args, context, info) => {
        const { name } = args
        return species[name]
      },
    },
    Taxon: {
      __resolveReference: (sp, args, context, info) => {
          return species[sp.name]
      },
      rank: (sp) => species[sp.name].rank,
      taxonomy: (sp) => { for (const x of taxontree) {
        //service.log.info("sp: " + sp.name + " with item: " + `${x.genus} ${x.epithet}`)
        if (sp.name === `${x.genus} ${x.epithet}`) return x
      }}
    }
  }

  await service.register(mercurius, {
    schema,
    resolvers,
    federationMetadata: true,
    graphiql: true,
    jit: 1,
    path: '/'
  })

  service.listen({ port: 5001 }, function (err, address) {
    if (err) {
      service.log.error(err)
      process.exit(1)
    }
    service.log.info(`service listening on ${address}`)
  })
}

startService()
