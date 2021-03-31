# mineflayer-test-api
[![NPM version](https://img.shields.io/npm/v/mineflayer-test-api.svg)](http://npmjs.com/package/prismarine-template)
[![Build Status](https://github.com/PrismarineJS/mineflayer-test-api/workflows/CI/badge.svg)](https://github.com/PrismarineJS/mineflayer-test-api/actions?query=workflow%3A%22CI%22)
[![Discord](https://img.shields.io/badge/chat-on%20discord-brightgreen.svg)](https://discord.gg/GsEFRM8)
[![Try it on gitpod](https://img.shields.io/badge/try-on%20gitpod-brightgreen.svg)](https://gitpod.io/#https://github.com/PrismarineJS/mineflayer-test-api)

An automated testing library for Mineflayer and Mineflayer plugins with CI/CD.

## Usage

```js
const testAPI = require('mineflayer-test-api')
const mineflayer = require('mineflayer')

const server = testAPI.createServer()

server.on('start', () => {
  const bot = mineflayer.createBot({
    host: 'localhost',
    port: server.port,
    username: 'testBot123'
  })
})
```
