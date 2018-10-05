const path = require('path')
const { copySync } = require('fs-extra')

module.exports = (current, halsa, directory) => {
  const target = path.join(current, directory)
  const template = path.join(halsa, '../template')

  copySync(template, target)
}