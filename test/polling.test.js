'use strict'

const { test } = require('tap')
const fastify = require('fastify')
const plugin = require('../index')

// https://core.telegram.org/bots/features#creating-a-bot-in-the-test-environment
const realBotToken = process.env.BOT_TOKEN_TEST

test('Validation - Token required', async (t) => {
  const app = fastify()
  app.register(plugin)

  try {
    await app.ready()
    t.fail('plugin loads successfully')
  } catch (error) {
    t.equal(error.message, 'fastify-telegram: botToken is required')
  }
})

test('Validation - Same decorator name', async (t) => {
  const app = fastify()
  app.register(plugin, { botToken: '1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ', decoratorBotName: 'telegram' })
  app.register(plugin, { botToken: '1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ', decoratorBotName: 'telegram' })

  try {
    await app.ready()
    t.fail('plugin loads successfully')
  } catch (error) {
    t.equal(error.message, 'fastify-telegram: fastify.telegram already exists')
  }
})

test('Validation - Token invalid', async (t) => {
  const app = fastify()
  app.register(plugin, {
    botToken: '1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  })

  try {
    await app.ready()
    t.fail('plugin loads successfully')
  } catch (error) {
    t.equal(error.message, 'fastify-telegram: bot.launch() failed: 401: Unauthorized')
  }
})

test('Start polling', async (t) => {
  const app = fastify({ pluginTimeout: 10_000 })
  t.teardown(() => app.close())

  app.register(plugin, {
    botToken: realBotToken
  })

  await app.ready()
  t.ok(app.telegramBot, 'app.telegramBot exists')
  t.notOk(app.telegramWebhook, 'app.telegramWebhook does not exist')
  t.pass('plugin loads successfully')
})
