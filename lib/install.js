const { copySync } = require('fs-extra')
const path = require('path')

module.exports = (current, halsa, directory) => {
  const target = path.join(current, directory)
  const template = path.join(halsa, '../template')
  
  copySync(template, target)
}