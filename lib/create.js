const fs = require('fs')
const path = require('path')
const { copySync } = require('fs-extra')

module.exports = (current, halsa, directory) => {
  const target = path.join(current, directory)
  const template = path.join(halsa, '../template')
  const config = require(template + '/halsa.json')

  config['halsa']['layout'] = path.join(current, 'layout')
  config['halsa']['theme'] = path.join(current, 'theme')

  fs.writeFileSync(template + '/halsa.json', JSON.stringify(config, false, 2))

  copySync(template, target)
}