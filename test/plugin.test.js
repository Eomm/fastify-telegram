'use strict'

const { test } = require('tap')
const fastify = require('fastify')
const plugin = require('../index')

test('Basic test', async (t) => {
  const app = fastify()
  await app.register(plugin)

  await app.ready()
})
