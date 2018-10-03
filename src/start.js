const chalk = require('chalk')
const path = require('path')
const build = require('./build')
const http = require('http')
const reload = require('reload')
const express = require('express')
const chokidar = require('chokidar')
const package = require('../package')
const { pathExistsSync } = require('fs-extra')

module.exports = (halsa, project, config) => {
  const app = express()
  const target = path.join(project, '.halsa')
  const port = config['port'] || 3000

  // if (!pathExistsSync(target)) {
    build(project)
  // }

  app.set('port', port)
  app.get('/', (req, res) => {
    res.sendFile(path.join(target, 'index.html'))
  })

  app.use('/', express.static(target))

  const server = http.createServer(app)

  server.listen(app.get('port'), function () {
    console.log('Web server listening on port ' + app.get('port'))
  })
}