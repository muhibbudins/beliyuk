const fs = require('fs')
const fx = require('fs-extra')
const path = require('path')
const yaml = require('read-yaml')
const helper = require('./helper')
const {
  getFile,
  setFile
} = require('./utils')

module.exports = async (directory) => {
  const buildDirectory = path.resolve(directory, '.halsa')
  const dataDirectory = path.resolve(buildDirectory, 'data')
  const configDirectory = yaml.sync(path.resolve(directory, 'halsa.yml'))

  if (!fs.existsSync(buildDirectory)) {
    fs.mkdirSync(buildDirectory)
  }

  if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory)
  }

  fs.writeFileSync(
    path.join(dataDirectory, 'config.json'),
    JSON.stringify(configDirectory, false, 2)
  )

  helper()

  Promise.all(['pages', 'themes', 'layouts'].map(async (section) => {
    const bracket = {}
    const source = await getFile(directory, section)
    const filter = await source.filter(item => {
      return item && configDirectory['ignored'].indexOf(item['route'].split('/').pop()) === -1
    })

    fs.writeFileSync(
      path.join(dataDirectory, `${section}.json`),
      JSON.stringify(filter, false, 2)
    )

    if (section === 'pages') {
      source.map(item => {
        bracket[item['category']] = {
          name: item['category'],
          pages: []
        }

        return item
      }).map(item => {
        bracket[item['category']]['pages'].push(item)
      })

      fs.writeFileSync(
        path.join(dataDirectory, 'categories.json'),
        JSON.stringify(bracket, false, 2)
      )
    }

    return await setFile(source, section, bracket)
  }))

  const staticPath = path.join(directory, 'static')
  const staticTarget = path.join(buildDirectory, 'static')

  fx.copySync(staticPath, staticTarget)
}