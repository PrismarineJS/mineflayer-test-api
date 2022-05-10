const { Wrap, download } = require('minecraft-wrap')
const mc = require('minecraft-protocol')
const path = require('path')
const assert = require('assert')
const { once } = require('events')
const mineflayer = require('mineflayer')
const { v4: uuidv4 } = require('uuid')
const events = require('events')

async function sleep (time) {
  await new Promise(resolve => setTimeout(resolve, time))
}

async function startServer (options) {
  const version = options.version
  const port = options.port ?? Math.round(30000 + Math.random() * 20000)
  const mcData = require('minecraft-data')(version)
  const serverPath = path.join(process.cwd(), 'server')
  const logToConsole = options.logToConsole ?? true
  const cleanup = options.cleanup ?? true

  const serverJarDir = process.env.MC_SERVER_JAR_DIR || `${process.cwd()}/server_jars`
  const serverJar = `${serverJarDir}/minecraft_server.${version}.jar`
  const wrap = new Wrap(serverJar, `${serverPath}_${version}`)

  if (logToConsole) {
    wrap.on('line', (line) => {
      console.log(line)
    })
  }

  const server = {
    port,
    mcData,
    serverPath,
    version
  }

  const propOverrides = {
    'level-type': 'FLAT',
    'spawn-npcs': 'true',
    'spawn-animals': 'false',
    'online-mode': 'false',
    gamemode: '1',
    'spawn-monsters': 'false',
    'generate-structures': 'false',
    'enable-command-block': 'true',
    'server-port': port.toString()
  }

  await new Promise((resolve, reject) => {
    console.log(`Downloading ${version} server jar`)
    download(version, serverJar, (err) => {
      if (err) {
        reject(err)
        return
      }

      console.log(`Starting ${version} server`)
      wrap.startServer(propOverrides, (err2) => {
        if (err2) {
          reject(err2)
          return
        }

        console.log(`Pinging server, version: ${version}, port: ${port}`)
        mc.ping({
          port,
          version
        }, (err3, results) => {
          if (err3) {
            reject(err3)
            return
          }

          console.log(`Latency: ${results.latency}`)
          assert.ok(results.latency >= 0)
          assert.ok(results.latency <= 1000)
          resolve()
        })
      })
    })
  })

  server.stop = async function () {
    await new Promise((resolve, reject) => {
      wrap.stopServer((err) => {
        if (err) {
          reject(err)
          return
        }

        if (cleanup) {
          wrap.deleteServerData((err2) => {
            if (err2) {
              reject(err)
              return
            }

            resolve()
          })
        }
      })
    })
  }

  server.createBot = async function (botOptions = {}) {
    const bot = mineflayer.createBot({
      host: 'localhost',
      port: server.port,
      username: uuidv4().substring(0, 15),
      version: server.version
    })

    await events.once(bot, 'spawn')
    if (botOptions.makeOp) await server.makeOp(bot)
    if (botOptions.startPosition) await server.teleport(bot, botOptions.startPosition)

    return bot
  }

  server.makeOp = async function (bot) {
    wrap.writeServer(`op ${bot.username}\n`)
    await awaitServerMessage(bot, 'chat.type.admin')

    console.log(`Make ${bot.username} OP.`)
  }

  server.teleport = async function (bot, pos) {
    wrap.writeServer(`tp ${bot.username} ${pos.x} ${pos.y} ${pos.z}\n`)
    await once(bot, 'forcedMove')
    await bot.waitForChunksToLoad()

    console.log(`Teleported ${bot.username} to ${pos.x} ${pos.y} ${pos.z}.`)
  }

  server.setBlock = async function (pos, block) {
    wrap.writeServer(`setblock ${pos.x} ${pos.y} ${pos.z} minecraft:${block}\n`)
    await sleep(50)

    console.log(`Set block at ${pos.x} ${pos.y} ${pos.z} to ${block}`)
  }

  server.fillBlocks = async function (pos, size, block) {
    const end = pos.plus(size)
    wrap.writeServer(`fill ${pos.x} ${pos.y} ${pos.z} ${end.x} ${end.y} ${end.z} minecraft:${block}\n`)
    await sleep(50)

    console.log(`Filled region from ${pos.x} ${pos.y} ${pos.z} to ${end.x} ${end.y} ${end.z} with ${block}`)
  }

  server.runCommand = async function (cmd) {
    wrap.writeServer(`${cmd}\n`)
    await sleep(50)

    console.log(`Executed command '${cmd}'`)
  }

  return server
}

function awaitServerMessage (bot, type, timeout = 1000) {
  return new Promise((resolve, reject) => {
    function listener (message) {
      if (message.translate === type) {
        resolve()
        bot.off('message', listener)
      }
    }

    bot.on('message', listener)
    setTimeout(() => {
      reject(new Error('Server message timed out before fulfilled'))
      bot.off('message', listener)
    }, timeout)
  })
}

module.exports = {
  startServer
}
