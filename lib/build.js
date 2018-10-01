const fs = require('fs')
const { pathExistsSync, mkdirpSync, copyFileSync } = require('fs-extra')
const path = require('path')
const glob = require('glob')
const { toHTML } = require('from-mark')

module.exports = (directory, config) => {
  const directorySource = path.resolve(directory, 'pages')
  
  const getDetail = (mark) => {
    const rootPath = path.resolve(directory, 'build')
    const fullPath = mark.replace('pages', 'build').replace(/md|mdx/g, 'html')
    const fileName = fullPath.split('/').pop()
    const filePath = fullPath.replace(fileName, '')
    const routeName = fileName.replace('.html', '')
    const routePath = fullPath.replace(rootPath, '')

    if (!pathExistsSync(filePath)) {
      mkdirpSync(filePath)
    }

    fs.writeFileSync(fullPath, '# Blank page')

    return {
      name: routeName,
      route: routePath,
      file: fileName,
      path: fullPath
    }
  }

  const createFile = (files) => {
    const promises = []
    const source = []
    const layoutPath = `${directory}/layout/${config['layout']}`
    const themePath = `${directory}/theme/`

    if (!pathExistsSync(themePath.replace('theme', 'build/theme'))) {
      mkdirpSync(themePath.replace('theme', 'build/theme'))
    }
    copyFileSync(`${themePath + config['theme']}.css`, themePath.replace('theme/', `build/theme/${config['theme']}.css`))

    files.map(mark => {
      const detail = getDetail(mark)

      let template = fs.readFileSync(`${layoutPath}/page.html`, 'utf-8')
      if (detail['name'] === 'index') {
        template = fs.readFileSync(`${layoutPath}/landing.html`, 'utf-8')
      }
      const layout = template.replace('{theme}', `<link rel="stylesheet" type="text/css" href="${themePath.replace(directory, '') + config['theme']}.css">`)
      source.push(detail)
      promises.push(toHTML(mark, {
        head: '<script src="/reload/reload.js"></script>',
        layout: layout
      }))
    })

    Promise.all(promises).then(result => {
      fs.writeFileSync(path.resolve(directory, 'build/routes.json'), JSON.stringify(source))
      result.map((html, index) => {
        fs.writeFileSync(source[index]['path'], html)
      })
    })
  }

  glob(`${directorySource}/**/*.md`, (err, files) => {
    createFile(files)
  })
}
