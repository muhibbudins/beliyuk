const fs = require('fs')
const fx = require('fs-extra')
const path = require('path')
const glob = require('glob')
const { toJSON, toHTML } = require('from-mark')

module.exports = (directory, options) => {
  const directoryBuild = path.resolve(directory, 'build')
  const directorySource = path.resolve(directory, 'pages')
  
  const getDetail = (mark) => {
    const rootPath = path.resolve(directory, 'build')
    const fullPath = mark.replace('pages', 'build').replace(/md|mdx/g, 'html')
    const fileName = fullPath.split('/').pop()
    const filePath = fullPath.replace(fileName, '')
    const routeName = fileName.replace('.html', '')
    const routePath = fullPath.replace(rootPath, '')

    if (!fx.pathExistsSync(filePath)) {
      fx.mkdirpSync(filePath)
    }

    fs.writeFileSync(fullPath, '# Blank page')

    return {
      name: routeName,
      route: routePath,
      file: fileName,
      path: fullPath
    }
  }

  const replacer = (string) => {
    return new Promise(resolve => {
      const post = fs.readFileSync('../component/post.html')
      const x = string.replace('{posts}', post)

      resolve(x)
    })
  }

  const createPage = async (markdown, layout) => {
    const data = await toJSON(markdown)
    const string = await toHTML(markdown, {
      head: '<script src="/reload/reload.js"></script>',
      layout: layout
    })
    const page = await replacer(string)

    return {
      page,
      data
    }
  }

  const createFile = (files) => {
    const promises = []
    const source = []
    const layoutPath = path.join(options['halsa']['layout'], options['layout'])
    const sourceThemePath = path.join(options['halsa']['theme'], options['theme'])
    const themePath = path.join(directory, 'build/theme/')
    const targetThemePath = `${themePath + options['theme']}.css`

    if (!fx.pathExistsSync(themePath)) {
      fx.mkdirpSync(themePath)
    }
    fx.copyFileSync(`${sourceThemePath}.css`, targetThemePath)

    files.map(markdown => {
      const detail = getDetail(markdown)
      let template = fs.readFileSync(`${layoutPath}/page.html`, 'utf-8')

      if (detail['name'] === 'index') {
        template = fs.readFileSync(`${layoutPath}/landing.html`, 'utf-8')
      }

      const themeLink = `<link rel="stylesheet" type="text/css" href="${targetThemePath.replace(directoryBuild, '')}">`
      const layout = template.replace('{theme}', themeLink)

      source.push(detail)
      promises.push(createPage(markdown, layout))
    })

    Promise.all(promises).then(result => {
      const x = []
      fs.writeFileSync(path.resolve(directory, 'build/routes.json'), JSON.stringify(source, false, 2))
      result.map((res, index) => {
        fs.writeFileSync(source[index]['path'], res['page'])
        x.push(res['data'])
      })
      fs.writeFileSync(path.resolve(directory, 'build/posts.json'), JSON.stringify(x, false, 2))
    })
  }

  glob(`${directorySource}/**/*.md`, (err, files) => {
    createFile(files)
  })
}
