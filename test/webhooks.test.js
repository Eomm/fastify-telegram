'use strict'

const { test } = require('tap')
const fastify = require('fastify')
const plugin = require('../index')

// https://core.telegram.org/bots/features#creating-a-bot-in-the-test-environment
const realBotToken = process.env.BOT_TOKEN_TEST
const realWebhookSecret = process.env.WEBHOOK_SECRET_TEST // ngrok http 3001

test('Validation - Token required', async (t) => {
  const app = fastify()
  app.register(plugin, {
    baseUrl: 'http://localhost:3000'
  })

  try {
    await app.ready()
    t.fail('plugin loads successfully')
  } catch (error) {
    t.equal(error.message, 'fastify-telegram: botToken is required')
  }
})

test('Validation - Token invalid', async (t) => {
  const app = fastify()
  app.register(plugin, {
    baseUrl: 'http://localhost:3000',
    botToken: '1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  })

  try {
    await app.ready()
    t.fail('plugin loads successfully')
  } catch (error) {
    t.equal(error.message, 'fastify-telegram: bot.createWebhook() failed: 401: Unauthorized')
  }
})

test('Does not start - test onClose hook', async (t) => {
  const app = fastify({ pluginTimeout: 10_000 })
  t.teardown(() => app.close())

  app.register(plugin, {
    baseUrl: realWebhookSecret,
    botToken: realBotToken
  })

  t.pass('plugin loads successfully')
})

test('Start webhook', async (t) => {
  const app = fastify({ pluginTimeout: 10_000 })
  t.teardown(() => app.close())

  app.register(plugin, {
    baseUrl: realWebhookSecret,
    botToken: realBotToken
  })

  await app.ready()

  t.ok(app.telegramBot, 'app.telegramBot exists')
  t.ok(app.telegramWebhook, 'app.telegramWebhook exists')
  t.pass('plugin loads successfully')
})
