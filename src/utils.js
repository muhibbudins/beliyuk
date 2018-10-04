const fs = require('fs')
const fx = require('fs-extra')
const path = require('path')
const glob = require('glob')
const mark = require('markdown').markdown
const pretty = require('pretty')
const yaml = require('read-yaml')
const sass = require('node-sass')
const template = require('template7')

let pathProject, pathBuild, pathLayout, pathData, appConfig

const getDetail = async (file, content, section) => {
  return new Promise(resolve => {
    const name = file.split('/').splice(-1, 1)
    let bracket = {
      file: {
        source: file,
        directory: file.replace(pathProject, pathBuild).replace(name, ''),
        target: file.replace(pathProject, pathBuild)
      },
      route: file.replace(pathProject, ''),
      content: {}
    }

    if (section === 'pages') {
      const document = /^-{3}[^\0]*?-{3}/g.exec(content)

      if (document && document[0]) {
        const rows = document[0].split('\n').filter(item => item !== '---')

        bracket['category'] = 'Pages'
        bracket['date'] = fs.statSync(file)['ctime']

        rows.map(item => {
          const split = item.split(':').map(item => item.trim())
          bracket['content'][split[0]] = split[1]
        })

        bracket['route'] = file.replace(
          path.join(pathProject, 'pages'), ''
        ).replace(/md|mdx/g, 'html')

        bracket['file']['target'] = bracket['file']['target'].replace('pages/', '').replace(/md|mdx/g, 'html')
        bracket['file']['directory'] = bracket['file']['directory'].replace('pages/', '').replace(/md|mdx/g, 'html')
      }
    }

    if (section === 'themes') {
      bracket['file']['target'] = bracket['file']['target'].replace(/sass|scss/g, 'css')
    }

    resolve(bracket)
  })
}

const getContent = async (file, section) => {
  return new Promise(resolve => {
    Promise.all(file.map(async (item, index) => {
      const content = fs.readFileSync(item, 'utf-8')
      return await getDetail(item, content, section)
    })).then(res => {
      resolve(res)
    })
  })
}

const setContent = async (content, file, section) => {
  return new Promise(resolve => {
    if (section === 'pages') {
      let pageContent = mark.toHTML(content.replace(/^-{3}[^\0]*?-{3}/g, ''))

      const layoutProps = ['categories', 'pages', 'config']
      const layoutSource = path.join(pathLayout, `${file['content']['layout']}.html`)
      const layoutContent = fs.readFileSync(layoutSource, 'utf-8')

      const beforeCompile = template.compile(
        layoutContent
          .replace('{{ title }}', file['content']['title'])
          .replace('{{ content }}', pageContent.replace(/\n/g, ''))
          .replace('{{ theme }}', `<link rel="stylesheet" href="/themes/${appConfig['theme']}.css">`)
          .replace('</body>', `<script src="/reload/reload.js"></script></body>`)
      )
      const context = {}

      layoutProps.map(item => {
        context[item] = require(path.join(pathData, `${item}.json`))
      })

      const afterCompile = beforeCompile(context)

      resolve(
        pretty(
          afterCompile
            .replace(/\n/g, '')
            .replace(/(\/layouts|\/pages|\/static|\/themes)/g, `${appConfig['domain']}$1`)
            .replace(/(src="\/|href="\/)/g, `$1${appConfig['domain']}/`)
            .replace(/="\/http/g, '="http')
        )
      )
    }

    if (section === 'themes') {
      sass.render({ data: content }, (err, result) => {
        resolve(new Buffer(result.css, 'utf8'))
      })
    }
  })
}

const setFile = async (source, section, categories) => {
  return new Promise(resolve => {
    Promise.all(source.map(async (file) => {
      const string = fs.readFileSync(file['file']['source'], 'utf-8')
      const content = await setContent(string, file, section, categories)

      if (!fs.existsSync(file['file']['directory'])) {
        await fx.mkdirpSync(file['file']['directory'])
      }

      fs.copyFileSync(file['file']['source'], file['file']['target'])
      fs.writeFileSync(file['file']['target'], content)
    }))
  })
}

const getFile = async (current, section) => {
  pathProject = current
  pathBuild = path.resolve(pathProject, '.halsa')
  pathLayout = path.resolve(pathProject, 'layouts')
  pathData = path.resolve(pathBuild, 'data')
  appConfig = yaml.sync(path.resolve(pathProject, 'halsa.yml'))

  return new Promise(resolve => {
    glob(`${pathProject + '/' + section}/**/*`, async (err, file) => {
      const files = file.filter(item => item.includes('.'))
      resolve (
        await getContent(files, section)
      )
    })
  })
}

module.exports = {
  getFile,
  getDetail,
  getContent,
  setContent,
  setFile
}