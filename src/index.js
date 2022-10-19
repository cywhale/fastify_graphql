'use strict'
import Fastify from 'fastify'
import mercurius from 'mercurius'

/* npm start
   npm run gateway
   open browser: http://localhost:5000/graphql
query Q1($name: String!) {
  sp(name: $name) {
    name
    rank
    taxonomy {
      genus
      family
    }
    traits {
      id
      keystr
      sex
      parent {
        id
        keystr
      }
    }
    sexTraitInfo
  }
}
variables: {"name":"B xyz"}*/

const startServer = async () => {
  const gateway = Fastify({
      logger: true
  })

  await gateway.register(mercurius, {
    graphiql: true,
    jit: 1,
    gateway: {
      services: [{
        name: 'species',
        url: 'http://localhost:5001',
        //setResponseHeaders: (reply) => {
        //  reply.header('x-route', 'test')
        //}
      }, {
        name: 'trait',
        url: 'http://localhost:5002'
      }]
    }
  })

  gateway.listen({ port: 5000 }, function (err, address) {
    if (err) {
      gateway.log.error(err)
      process.exit(1)
    }
    gateway.log.info(`server listening on ${address}`)
  })
}

startServer()

