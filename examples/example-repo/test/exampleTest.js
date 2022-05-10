const { registerTest } = require('mineflayer-test-api')

registerTest('run forward', async (server, startPosition) => {
  const bot = await server.createBot({
    makeOp: true,
    startPosition: startPosition
  })

  bot.setControlState('sprint', true)
  bot.setControlState('forward', true)

  await bot.waitForTicks(20)

  if (bot.entity.position.distanceTo(startPosition) < 5) throw new Error('Bot move too little!')
  if (bot.entity.position.distanceTo(startPosition) > 15) throw new Error('Bot moved too far!')
})
