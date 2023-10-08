'use strict'

const fp = require('fastify-plugin')

function fastifyTelegram (fastify, options, next) {
  // todo
  next()
}

const plugin = fp(fastifyTelegram, {
  name: 'fastify-telegram',
  fastify: '^4.0.x'
})

module.exports = plugin
module.exports.default = plugin
module.exports.fastifyOverview = plugin
