const template = require('template7')

const sample = () => {
  template.registerHelper('sample', (data) => {
    return `
      <div class="example">
        ${JSON.stringify(data)}
      </div>
    `
  })
}

module.exports = {
  sample
}