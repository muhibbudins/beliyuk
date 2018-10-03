const fs = require('fs')
const fx = require('fs-extra')
const path = require('path')
const glob = require('glob')
const mark = require('markdown').markdown
const pretty = require('pretty')
const yaml = require('read-yaml')
const sass = require('node-sass')
const template = require('template7')

module.exports = async (directory) => {
  const PROJECT = directory
  const BUILD = path.resolve(PROJECT, '.halsa')
  const LAYOUT = path.resolve(PROJECT, 'layouts')
  const THEME = path.resolve(PROJECT, 'themes')
  const DATA = path.resolve(BUILD, 'data')
  const CONFIG = yaml.sync(path.resolve(PROJECT, 'halsa.yml'))

  if (!fs.existsSync(BUILD)) {
    fs.mkdirSync(BUILD)
  }

  if (!fs.existsSync(DATA)) {
    fs.mkdirSync(DATA)
  }

  const detail = async (file, content, section) => {
    return new Promise(resolve => {
      const name = file.split('/').splice(-1, 1)
      let bracket = {
        path: file,
        route: file.replace(directory, ''),
        targetPath: file.replace(PROJECT, BUILD).replace(name, ''),
        targetFile: file.replace(PROJECT, BUILD)
      }

      if (section === 'pages') {
        const document = /^-{3}[^\0]*?-{3}/g.exec(content)

        if (document && document[0]) {
          const cleared = content.replace(document[0], '')
          const rows = document[0].split('\n').filter(item => item !== '---')
  
          bracket['category'] = 'Pages'
          bracket['date'] = fs.statSync(file)['ctime']

          rows.map(item => {
            const split = item.split(':').map(item => item.trim())
            bracket[split[0]] = split[1]
          })

          bracket['route'] = file.replace(
            path.join(directory, 'pages'), ''
          ).replace(/md|mdx/g, 'html')

          bracket['targetFile'] = bracket['targetFile'].replace('pages/', '').replace(/md|mdx/g, 'html')
          bracket['targetPath'] = bracket['targetPath'].replace('pages/', '').replace(/md|mdx/g, 'html')
        }
      }

      if (section === 'themes') {
        bracket['targetFile'] = bracket['targetFile'].replace(/sass|scss/g, 'css')
      }

      resolve(bracket)
    })
  }

  const extract = async (file, section) => {
    return new Promise(resolve => {
      Promise.all(file.map(async (item, index) => {
        const content = fs.readFileSync(item, 'utf-8')
        return await detail(item, content, section)
      })).then(res => {
        resolve(res)
      })
    })
  }

  const setContent = async (content, file, section) => {
    return new Promise(resolve => {
      if (section === 'pages') {
        let pageContent = mark.toHTML(content.replace(/^-{3}[^\0]*?-{3}/g, ''))

        const layoutProps = ['categories', 'pages']
        const layoutSource = path.join(LAYOUT, `${file['layout']}.html`)
        const layoutContent = fs.readFileSync(layoutSource, 'utf-8')

        const beforeCompile = template.compile(
          layoutContent
            .replace('{{ title }}', file['title'])
            .replace('{{ content }}', pageContent.replace(/\n/g, ''))
            .replace('{{ theme }}', `<link rel="stylesheet" href="/themes/${CONFIG['theme']}.css">`)
            .replace('</body>', `<script src="/reload/reload.js"></script></body>`)
        )
        const context = {}

        layoutProps.map(item => {
          context[item] = require(path.join(DATA, `${item}.json`))
        })

        const afterCompile = beforeCompile(context)

        resolve(
          pretty(afterCompile.replace(/\n/g, ''))
        )
      }

      if (section === 'themes') {
        sass.render({ data: content }, (err, result) => {
          resolve(new Buffer(result.css, 'utf8'))
        })
      }
    })
  }

  const create = async (source, section, categories) => {
    return new Promise(resolve => {
      Promise.all(source.map(async (file) => {
        const string = fs.readFileSync(file['path'], 'utf-8')
        const content = await setContent(string, file, section, categories)

        if (!fs.existsSync(file['targetPath'])) {
          await fx.mkdirpSync(file['targetPath'])
        }

        fs.copyFileSync(file['path'], file['targetFile'])
        fs.writeFileSync(file['targetFile'], content)
      }))
    })
  }

  const listing = async (section) => {
    return new Promise(resolve => {
      glob(`${PROJECT + '/' + section}/**/*`, async (err, file) => {
        const files = file.filter(item => item.includes('.'))
        resolve(
          await extract(files, section)
        )
      })
    })
  }

  Promise.all(['pages', 'themes', 'layouts'].map(async (section) => {
    const categories = {}
    const source = await listing(section)
    const filterize = await source.filter(item => {
      return item && item['route'] !== '/index.html'
    })
    fs.writeFileSync(path.join(DATA, `${section}.json`), JSON.stringify(filterize, false, 2))

    if (section === 'pages') {
      source.map(item => {
        categories[item['category']] = {
          name: item['category'],
          pages: []
        }

        return item
      }).map(item => {
        categories[item['category']]['pages'].push(item)
      })

      fs.writeFileSync(path.join(DATA, 'categories.json'), JSON.stringify(categories, false, 2))
    }

    return await create(source, section, categories)
  }))

  const staticPath = path.join(PROJECT, 'static')
  const staticTarget = path.join(BUILD, 'static')

  if (!fs.existsSync(staticTarget)) {
    fx.copySync(staticPath, staticTarget)
  }
}