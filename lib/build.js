const fs = require('fs')
const { pathExistsSync, mkdirpSync } = require('fs-extra')
const path = require('path')
const glob = require('glob')
const { toHTML } = require('from-mark')

module.exports = (directory) => {
  const directorySource = path.resolve(directory, 'source')
  
  const getDetail = (mark) => {
    const fullPath = mark.replace('source', 'build').replace(/md|mdx/g, 'html')
    const fileName = fullPath.split('/').pop()
    const filePath = fullPath.replace(fileName, '')

    if (!pathExistsSync(filePath)) {
      mkdirpSync(filePath)
    }

    fs.writeFileSync(fullPath, '# Blank page')

    return {
      name: fileName,
      path: fullPath,
      root: filePath
    }
  }

  glob(`${directorySource}/**/*.md`, (err, files) => {
    const promises = []
    const source = []

    files.map(mark => {
      promises.push(toHTML(mark))
      source.push(getDetail(mark))
    })

    Promise.all(promises).then(result => {
      result.map((html, index) => {
        fs.writeFileSync(source[index]['path'], html)
      })
    })
  })
}
