const path = require('path')
const build = require('./lib/build')
const serve = require('./lib/serve')

const halsa = (target) => {
  const directory = !target ? __dirname : path.resolve(__dirname, target)

  serve(directory)
}

halsa('./example')