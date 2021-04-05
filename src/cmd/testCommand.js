import { getDefinedTests, runTests } from '../mineflayerTest.js'

const versions = process.argv.splice(0, 2)
if (versions.length === 0) {
  console.log('Usage: npm run mineflayer-test [mcVersion1] [mcVersion2] ...')
  process.exit(1)
}

const tests = getDefinedTests()
runTests(tests, versions)
  .then(failedSome => process.exit(failedSome ? 1 : 0))
  .catch(err => console.log(err))
