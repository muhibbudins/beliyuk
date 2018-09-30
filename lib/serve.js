const path = require('path')
const express = require('express')

module.exports = (directory) => {
  const app = express()
  const build = directory + '/build/'

  app.get('/', (req, res) => {
    res.sendFile(path.join(build, 'index.html'))
  })

  app.use('/', express.static(build))
  app.listen(3000, () => {
    // served
  })
}