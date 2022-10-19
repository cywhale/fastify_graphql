'use strict'
import Fastify from 'fastify'
import mercurius from 'mercurius'

/* open browser: http://localhost:5002/
query Q1($name: String!) {
  getTraits(name: $name) {
    id
    keystr
    sex
    taxon {
      name
      sexTraitInfo
    }
  }
variables: {"name":"B xyz"}*/

const traits = [
    {
      id: 'A_02a',
      species: 'A abc',
      keystr: 'Prosome in general spindle-shaped',
      sex: 'female',
      parent: [{
        id: 'A_01a',
        keystr: 'Anal somite longer than urosomite',
      }]
    },
    {
      id: 'A_02b',
      species: 'A def',
      keystr: 'Prosome posterodorsally with a pair of setules',
      sex: 'female',
      parent: [{
        id: 'A_01b',
        keystr: 'Anal somite not wider than urosomite',
      }]
    },
    {
      id: 'B_03a',
      species: 'B xyz',
      keystr: 'Genital swelling approximately central on somite',
      sex: 'female',
      parent: [{
        id: 'B_01a',
        keystr: 'Rostral filaments absent',
      }]
    },
    {
      id: 'B_03b',
      species: 'B xyz',
      keystr: 'Genital swelling righht on somite',
      sex: 'male',
      parent: [{
        id: 'B_01a',
        keystr: 'Rostral filaments absent',
      }]
    },
    {
      id: 'C_04b',
      species: 'C tuv',
      keystr: 'Anal somite naked or with very fine spinules',
      sex: 'male',
      parent: [{
        id: 'C_02a',
        keystr: 'Length of caudal ramus nearly twice width',
      }]
    }
]

const schema = `
    type Trait @key(fields: "id") {
      id: ID!
      taxon: Taxon!
      keystr: String!
      sex: String
      parent: [TraitNode]
    }
    type TraitNode {
      id: String
      keystr: String
    }
    type Query @extends {
      getTraits(name: String!, sex: String): [Trait]
    }
    type Taxon @key(fields: "name") @extends {
      name: String! @external
      traits: [Trait] @requires(fields: "name")
      sexTraitInfo: String @requires(fields: "name")
    }`

const startService = async () => {
  const service = Fastify({logger: true})

  const resolvers = {
    Query: {
      getTraits: (root, args, context, info) => {
        const { name } = args
        let trx
        if (Object.hasOwn(args, 'sex') && args.sex) {
          trx = traits.filter(x => x.species === name && x.sex === args.sex)
        } else {
          trx = traits.filter(x => x.species === name)
        }
        return trx
      }
    },
    Trait: {
      __resolveReference: (trait, args, context, info) => {
          return traits.find(obj => obj.id === trait.id)
      },
      taxon: (trait, args, context, info) => {
        return {
          __typename: 'Taxon',
          name: traits.find(obj => obj.id === trait.id).species
        }
      }
    },
    Taxon: {
      traits: (taxon, args, context, info) => {
        return traits.filter(p => p.species === taxon.name)
      },
      sexTraitInfo: (taxon, args, context, info) => {
        return traits.filter(p => p.species === taxon.name).map(x => x.sex).join(",")
      }
    },
  }

  await service.register(mercurius, {
    schema,
    resolvers,
    federationMetadata: true,
    graphiql: true,
    jit: 1,
    path: '/'
  })

  service.listen({ port: 5002 }, function (err, address) {
    if (err) {
      service.log.error(err)
      process.exit(1)
    }
    service.log.info(`service listening on ${address}`)
  })
}

startService()
