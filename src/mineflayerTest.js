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
