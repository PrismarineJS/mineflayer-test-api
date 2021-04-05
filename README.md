# mineflayer-test-api
[![NPM version](https://img.shields.io/npm/v/mineflayer-test-api.svg)](http://npmjs.com/package/mineflayer-test-api)
[![Build Status](https://github.com/PrismarineJS/mineflayer-test-api/workflows/CI/badge.svg)](https://github.com/PrismarineJS/mineflayer-test-api/actions?query=workflow%3A%22CI%22)
[![Discord](https://img.shields.io/badge/chat-on%20discord-brightgreen.svg)](https://discord.gg/GsEFRM8)
[![Try it on gitpod](https://img.shields.io/badge/try-on%20gitpod-brightgreen.svg)](https://gitpod.io/#https://github.com/PrismarineJS/mineflayer-test-api)

An automated testing library for Mineflayer and Mineflayer plugins with CI/CD.

## Usage

In your project, create a folder called "test". In this folder, you can create as many test files as you want. Each of these will be iterated over and executed automatically. (Nested folders are allowed)

An example of a test script:

```js
// Load the registerTest function
const { registerTest } = require('mineflayer-test-api')
const mineflayer = require('mineflayer')
const events = require('events')

// Register a new test with a name an an async test function
registerTest('run forward', async (server, startPosition) => {

  // Create your bot and have it join the server
  const bot = mineflayer.createBot({
    host: 'localhost',
    port: server.port,
    username: 'bot123456'
  })

  // Wait for the bot to spawn
  await events.once(bot, 'spawn')

  // Make the bot op and teleport them to the start position
  await server.makeOp(bot)
  await server.teleport(bot, startPosition)

  // Run our test
  bot.setControlState('sprint', true)
  bot.setControlState('forward', true)
  await bot.waitForTicks(20)

  // Validate the test results.
  if (bot.entity.position.distanceTo(startPosition) < 5) throw new Error('Bot move too little!')
  if (bot.entity.position.distanceTo(startPosition) > 15) throw new Error('Bot moved too far!')
})
```

In your CI file, simply run `npm run mineflayer-test [mcVersion 1] [mcVersion 2] ...` to run all test files.
