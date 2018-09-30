const path = require('path')
const express = require('express')

module.exports = (directory) => {
  const app = express()

  app.get('/', (req, res) => {
    res.sendFile(path.join(directory + '/build/', 'index.html'))
  })

  app.use('/', express.static(directory + '/build/'))
  app.listen(3000, () => {
    console.log(`Example app listening on port ${3000}!`)
  })
}