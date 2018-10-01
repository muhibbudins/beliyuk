const chalk = require('chalk')
const path = require('path')
const build = require('./build')
const http = require('http')
const reload = require('reload')
const express = require('express')
const chokidar = require('chokidar')
const package = require('../package')
const { pathExistsSync } = require('fs-extra')

// module.exports = (directory) => {
  // console.log(`[${chalk.green.bold('halsa')}] Using Halsa CLI v${package.version}`)

  const directory = process.cwd()
  const app = express()
  const source = [
    path.join(directory, '/pages/'),
    path.join(directory, '/layout/'),
    path.join(directory, '/theme/')
  ]
  const target = path.join(directory, '/build/')
  const halsa = path.join(directory, 'halsa.json')

  if (!pathExistsSync(halsa)) {
    console.log(`[${chalk.red.bold('error')}] Process exited cause ${chalk.red.bold('halsa.json is not found')}`)
    console.log(`[${chalk.red.bold('error')}] Please run ${chalk.green.bold('halsa start')} on valid folder`)

    process.exit(0)
  }

  const config = require(halsa)
  const port = config['port'] || 3000
  const watcher = chokidar.watch(source, {
    ignored: /^\./,
    persistent: true
  })

  if (!pathExistsSync(target)) {
    build(directory, config)
  }

  app.set('port', port)
  app.get('/', (req, res) => {
    res.sendFile(path.join(target, 'index.html'))
  })

  app.use('/', express.static(target))

  const server = http.createServer(app)
  const reloadServer = reload(app)
  const restart = (file) => {
    console.log(`[${chalk.green.bold('halsa')}] File ${file} changed`)
    build(directory, config)
    reloadServer.reload()
    console.log(`[${chalk.green.bold('halsa')}] Project already running on port ${port}`)
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
// }