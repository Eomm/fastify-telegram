'use strict'

const timeout = require('node:timers/promises').setTimeout

const fp = require('fastify-plugin')
const { Telegraf } = require('telegraf')

async function fastifyTelegram (app, options) {
  const {
    decoratorBotName = 'telegramBot',
    baseUrl,
    webhookSecret,
    botToken,
    onUnhandledError = (err) => {
      app.log.error(err, 'fastify-telegram: unhandled error')
    }
  } = options

  if (!botToken) {
    throw new Error('fastify-telegram: botToken is required')
  }

  if (app[decoratorBotName]) {
    throw new Error(`fastify-telegram: fastify.${decoratorBotName} already exists`)
  }

  const bot = new Telegraf(botToken, {
    telegram: {
      // agent: { keepAlive: true } // todo
      // const { Agent } = require('undici')
      //  new Agent({
      //   keepAliveTimeout: 15,
      //   keepAliveMaxTimeout: 30
      // })
    }
  })
  bot.catch(onUnhandledError)

  app.decorate(decoratorBotName, bot)
  app.addHook('onClose', async function () {
    try {
      bot.stop() // it is sync...
    } catch (error) {
      app.log.warn(error, 'fastify-telegram: bot.stop() failed')
    }
  })

  // ****************************************
  // Long polling mode

  if (!baseUrl) {
    app.log.debug('Telegram long polling mode')

    app.addHook('onReady', async function startPolling () {
      // this function avoids memory leaks
      let startError = null
      function handleFatalError (err) {
        app.log.fatal(err, 'fastify-telegram: bot.launch() failed')
        startError = err
      }

      // bot.launch is an endless loop
      // it triggers an error during startup if the config is invalid
      await Promise.race([
        bot.launch({ webhook: undefined }).catch(handleFatalError),
        timeout(app.initialConfig.pluginTimeout / 2)
      ])

      if (startError) {
        const fail = new Error(`fastify-telegram: bot.launch() failed: ${startError.message}`)
        fail.cause = startError
        throw fail
      }
    })
    return
  }

  // ****************************************
  // Webhook mode

  let webhookFn
  const routePath = `/telegraf/${bot.secretPathComponent()}`
  app.decorate('telegramWebhook', routePath)

  app.addHook('onReady', async function startWebHook () {
    try {
      webhookFn = await bot.createWebhook({
        domain: baseUrl, // Public domain for webhook
        secret_token: webhookSecret
      })
    } catch (error) {
      const fail = new Error(`fastify-telegram: bot.createWebhook() failed: ${error.message}`)
      fail.cause = error
      throw fail
    }
  })

  app.post(routePath, async (request, reply) => {
    if (!webhookFn) {
      throw new Error('Webhook not started - retry later')
    }

    reply.hijack() // Telegraf handles the reply
    request.raw.body = request.body
    await webhookFn(request.raw, reply.raw)
  })
}

const plugin = fp(fastifyTelegram, {
  name: 'fastify-telegram',
  fastify: '^4.0.x'
})

module.exports = plugin
module.exports.default = plugin
module.exports.fastifyOverview = plugin
