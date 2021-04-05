import { startServer } from './server.js'
import vec3 from 'vec3'
import path from 'path'
import fs from 'fs'

const { Vec3 } = vec3

let testList = []
let currentDir = ''

export function registerTest (name, test) {
  testList.push({ name: `${currentDir}/${name}`, test })
}

export function getRegisteredTests () {
  return testList
}

export function clearTests () {
  testList = []
}

export function assignCurrentDir (dir) {
  currentDir = dir
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
    const testFile = path.relative(file, testFolder)
    assignCurrentDir(testFile)
    import(file)
  }
}

export function getDefinedTests () {
  clearTests()
  loadAllTestFiles()
  return getRegisteredTests()
}

export async function runTests (tests, mcVersions) {
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

    console.log(`Tests complete for Minecraft version ${version}. ${passed} tests passed, ${failed} tests failed.`)
  }

  return failedSome
}
