const { registerTest } = require('mineflayer-test-api')
const mineflayer = require('mineflayer')
const events = require('events')

registerTest('run forward', async (server, startPosition) => {
  const bot = mineflayer.createBot({
    host: 'localhost',
    port: server.port,
    username: 'bot123456'
  })

  await events.once(bot, 'spawn')
  await server.makeOp(server)
  await server.teleport(bot, startPosition)

  bot.setControlState('sprint', true)
  bot.setControlState('forward', true)

  await bot.waitForTicks(20)

  if (bot.entity.position.distanceTo(startPosition) < 5) throw new Error('Bot move too little!')
  if (bot.entity.position.distanceTo(startPosition) > 15) throw new Error('Bot moved too far!')
})
