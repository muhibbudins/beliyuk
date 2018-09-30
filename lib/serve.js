const path = require('path')
const build = require('./build')
const express = require('express')
const chokidar = require('chokidar')
const { pathExistsSync } = require('fs-extra')

module.exports = (directory) => {
  const app = express()
  const source = directory + '/source/'
  const target = directory + '/build/'
  const watcher = chokidar.watch(source, {
    ignored: /^\./,
    persistent: true
  })

  if (!pathExistsSync(target)) {
    build(directory)
  }

  watcher
    .on('add', (path) => build(directory))
    .on('change', (path) => build(directory))
    .on('unlink', (path) => build(directory))
    .on('error', (path) => {
      process.exit(0)
    })

  app.get('/', (req, res) => {
    res.sendFile(path.join(target, 'index.html'))
  })

  app.use('/', express.static(target))
  app.listen(3000, () => {
    // served
  })
}