const { startServer } = require('./server.js')
const { Vec3 } = require('vec3')
const path = require('path')
const fs = require('fs')
const url = require('url')

let testList = []

function registerTest (name, test) {
  testList.push({ name: `test/${path.basename(__filename)}/${name}`, test })
}

function getFiles (folder, files = []) {
  if (!fs.existsSync(folder)) {
    return files
  }

  for (let f of fs.readdirSync(folder)) {
    f = path.join(folder, f)
    if (fs.statSync(f).isDirectory()) {
      getFiles(f, files)
    } else {
      files.push(f)
    }
  }

  return files
}

function loadAllTestFiles () {
  const testFolder = `${process.cwd()}/test`
  const files = getFiles(testFolder)

  for (const file of files) {
    import(url.pathToFileURL(file))
  }
}

function getDefinedTests () {
  testList = []
  loadAllTestFiles()
  return testList
}

async function runTests (tests, mcVersions) {
  let failedSome = false
  for (const version of mcVersions) {
    let passed = 0
    let failed = 0

    console.log(`Testing for Minecraft version ${version}.`)
    const server = await startServer({ version })

    const runningTests = []

    let xOffset = 0
    for (const test of tests) {
      const testPosition = new Vec3(xOffset, 4, 0)

      runningTests.push(test.test(server, testPosition)
        .then(() => {
          console.log(`'${test.name}' test passed!`)
          passed += 1
        }).catch((err) => {
          console.log(`'${test.name}' test failed!`)
          console.log(err)
          failed += 1
          failedSome = true
        }))
      xOffset += 5000
    }

    await Promise.allSettled(runningTests)
    await server.stop()

    console.log(`Tests complete for Minecraft version ${version}. ${passed} tests passed, ${failed} tests failed.`)
  }

  return failedSome
}

module.exports = {
  registerTest,
  runTests,
  getDefinedTests
}
