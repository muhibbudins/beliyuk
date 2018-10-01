const fs = require('fs')
const fx = require('fs-extra')
const path = require('path')
const glob = require('glob')
const pretty = require('pretty')
const { toJSON, toHTML } = require('../../markdown/index')

const template = `
<html>
  <head>
    {document}
    {head}
  </head>
  <body>
    <header>
      {# header #}
    </header>
    <article>
      {content}
    </article>
    <footer>
      {# footer #}
    </footer>
    {body}
  </body>
</html>
`

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

  const createPage = async (markdown) => {
    const data = await toJSON(markdown)
    const page = await toHTML(markdown, {
      head: `
        <link rel="stylesheet" href="/theme/${options['theme']}.css" />
        <script src="/reload/reload.js"></script>
      `,
      layout: template.trim()
    })

    return {
      page,
      data
    }
  }

  const createFile = (files) => {
    return new Promise(resolve => {
      const promises = []
      const source = []
      const sourceThemePath = path.join(options['halsa']['theme'], options['theme'])
      const themePath = path.join(directory, 'build/theme/')
      const targetThemePath = `${themePath + options['theme']}.css`

      if (!fx.pathExistsSync(themePath)) {
        fx.mkdirpSync(themePath)
      }
      fx.copyFileSync(`${sourceThemePath}.css`, targetThemePath)

      files.map(markdown => {
        const detail = getDetail(markdown)
        source.push(detail)
        promises.push(createPage(markdown))
      })

      const getX = (arr) => {
        const b = {}

        arr['document'].map(item => {
          if (item.tag === 'title') {
            b[item.tag] = item.content
          }
          if (item.name === 'description') {
            b[item.name] = item.content
          }
        })

        return b
      }

      Promise.all(promises).then(result => {
        const x = []
        fs.writeFileSync(path.resolve(directory, 'build/routes.json'), JSON.stringify(source, false, 2))
        result.map((res, index) => {
          fs.writeFileSync(source[index]['path'], pretty(res['page']))
          x.push(getX(res['data']))
        })
        fs.writeFileSync(path.resolve(directory, 'build/posts.json'), JSON.stringify(x, false, 2))
        resolve('done')
      })
    })
  }

  const sleep = (time) => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(time)
      }, time)
    })
  }

  glob(`${directorySource}/**/*.md`, async (err, files) => {
    await createFile(files)

    glob(`${directoryBuild}/**/*.html`, (err, htmls) => {
      htmls.map(html => {
        const read = fs.readFileSync(html, 'utf-8')
        const res = read.replace(/{#(.*)#}/g, (section, element) => {
          return fs.readFileSync(`../component/${element.trim()}.html`)
        })
        fs.writeFileSync(html, pretty(res))
      })
    })
  })
}
