const chalk = require('chalk')
const path = require('path')
const build = require('./build')
const http = require('http')
const express = require('express')
const chokidar = require('chokidar')
const reload = require('reload')
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

  app.set('port', process.env.PORT || 3000)
  app.get('/', (req, res) => {
    res.sendFile(path.join(target, 'index.html'))
  })

  app.use('/', express.static(target))

  const server = http.createServer(app)
  const reloadServer = reload(app)
  const restart = (file) => {
    console.log(`[${chalk.green.bold('HALSA')}] File ${file} changed`)
    build(directory)
    reloadServer.reload()
    console.log(`[${chalk.green.bold('HALSA')}] Project already running on port 3000`)
  }

  watcher
    .on('add', (path) => restart(path))
    .on('change', (path) => restart(path))
    .on('unlink', (path) => restart(path))
    .on('error', (path) => {
      process.exit(0)
    })

  server.listen(app.get('port'), function () {
    console.log('Web server listening on port ' + app.get('port'))
  })
}