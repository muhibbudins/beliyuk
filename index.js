const path = require('path')
const { toHTML } = require('from-mark')

const halsa = (target) => {
  const directory = !target ? __dirname : path.resolve(__dirname, target)

  console.log(directory)
}

halsa('./example')