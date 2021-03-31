import { startServer } from '../server.js'
import { clearTests, getRegisteredTests, assignCurrentDir } from '../mineflayerTest.js'
import fs from 'fs'
import path from 'path'
import { Vec3 } from 'vec3'

function getFiles (folder, files = []) {
  for (const f of fs.readdirSync(folder)) {
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
    assignCurrentDir(path.relative(file, testFolder))
    import(file)
  }
}

function getTests () {
  clearTests()
  loadAllTestFiles()
  return getRegisteredTests()
}

async function runAllTests (mcVersions) {
  const tests = getTests()

  let failedSome = false
  for (const version of mcVersions) {
    let passed = 0
    let failed = 0

    console.log(`Testing for Minecraft version ${version}.`)
    const server = await startServer({ version })

    let xOffset = 0
    for (const test of tests) {
      const testPosition = new Vec3(xOffset, 4, 0)

      test.test(server, testPosition)
        .then(() => {
          console.log(`'${test.name}' test passed!`)
          passed += 1
        }).catch((err) => {
          console.log(`'${test.name}' test failed!`)
          console.log(err)
          failed += 1
          failedSome = true
        })
      xOffset += 5000
    }

    await server.stop()

    console.log(`Tests complete for Minecraft version ${version}. ${passed.length} tests passed, ${failed.length} tests failed.`)
  }

  return failedSome
}

const versions = process.argv.splice(0, 2)
if (versions.length === 0) {
  console.log('Usage: npm run mineflayer-test [mcVersion1] [mcVersion2] ...')
  process.exit(1)
}

runAllTests(versions)
  .then(failedSome => process.exit(failedSome ? 1 : 0))
  .catch(err => console.log(err))
