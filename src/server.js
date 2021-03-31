import mcWrapper from 'minecraft-wrap'
import mc from 'minecraft-protocol'
import path from 'path'
import assert from 'assert'
import minecraftData from 'minecraft-data'

const { Wrap, download } = mcWrapper

async function sleep (time) {
  await new Promise(resolve => setTimeout(resolve, time))
}

export async function startServer (options) {
  const version = options.version
  const port = options.port ?? Math.round(30000 + Math.random() * 20000)
  const mcData = minecraftData(version)
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

  server.makeOp = async function (bot) {
    wrap.writeServer(`op ${bot.username}`)
    await sleep(100)
  }

  server.teleport = async function (bot, pos) {
    wrap.writeServer(`tp ${bot.username} ${pos.x} ${pos.y} ${pos.z}`)
    await sleep(1000)
  }

  return server
}