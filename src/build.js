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
  const FOLDER = ['categories', 'layouts', 'pages', 'themes']
  const CONFIG = yaml.sync(path.resolve(PROJECT, 'halsa.yml'))

  if (!fs.existsSync(BUILD)) {
    fs.mkdirSync(BUILD)
  }

  if (!fs.existsSync(DATA)) {
    fs.mkdirSync(DATA)
  }

  const create = async (files) => {
    files.map(file => {
      const layout = path.join(LAYOUT, `${file['detail']['layout']}.html`)
      const html = fs.readFileSync(layout, 'utf-8')
      const source = fs.readFileSync(file['path'], 'utf-8')

      const route = file['route'].replace(PROJECT, '')
      const fileName = route.split('/').splice(-1, 1)
      const targetDir = path.join(BUILD, route.replace(fileName, ''))
      const target = path.join(BUILD, route)

      if (!fs.existsSync(targetDir)) {
        fx.mkdirpSync(targetDir)
      }

      const categories = require(path.resolve(DATA, 'categories.json'))
      const content = source.replace(/^-{3}[^\0]*-{3}/g, '')
      let string = mark.toHTML(content)
      string += '<script src="/reload/reload.js"></script>'
      const context = {
        people: categories
      }
      const compile = template.compile(
        html
          .replace('{{ content }}', string.replace(/\n/g, ''))
          .replace('{{ theme }}', `<link rel="stylesheet" href="/themes/${CONFIG['theme']}.css">`)
      )
      const compiled = compile(context)

      const result = pretty(
        compiled
      )

      fs.writeFileSync(target, result)
    })
  }

  const themes = async () => {
    return new Promise(resolve => {
      const targ = path.resolve(BUILD, 'themes')
      const file = path.resolve(THEME, `${CONFIG['theme']}.scss`)
      const fita = path.resolve(targ, `${CONFIG['theme']}.css`)
      
      if (!fs.existsSync(targ)) {
        fs.mkdirSync(targ)
      }
      
      sass.render({ file: file }, (err, result) => {
        fs.writeFileSync(fita, new Buffer(result.css, 'utf8'))

        resolve('done')
      })
    })
  }

  const detail = async (string) => {
    return new Promise(resolve => {
      let separator = false

      const line = string.split('\n')
      const bracket = {}

      line.map(row => {
        if (row.includes('---')) {
          separator = !separator
        }

        if (separator && row !== '---') {
          const split = row.split(':').map(item => item.trim())
          bracket[split[0]] = split[1]
        }
      })

      resolve(bracket)
    })
  }

  const extract = async (files, section) => {
    return new Promise(resolve => {
      Promise.all(files
        .filter(item => item.split('.').length > 1)
        .map(async (item) => {
          let data = {}
          const content = fs.readFileSync(item, 'utf-8')
          const ext = item.split('.').pop()
          const root = item.split('/')
          root.splice(-1, 1)

          if (section === 'categories') {
            data['name'] = item.split('/')[1]
          }

          if (section === 'pages') {
            data['name'] = item.split('/').pop()
          }

          if (['pages', 'categories'].indexOf(section) > -1) {
            data['route'] = item.replace(/pages|categories/, '').replace(/md|mdx/g, 'html').replace('//', '/')
            data['detail'] = await detail(content)
          }
          
          return {
            path: item,
            root: root.join('/') + '/',
            ...data
          }
        })
      ).then(result => {
        resolve(result)
      })
    })
  }

  const collect = async (section) => {
    return new Promise(resolve => {
      glob(`${PROJECT +'/'+ section}/**/*`, async (err, files) => {
        const data = {}
        data[section] = await extract(files, section)
        resolve(data)
      })
    })
  }

  const listPages = async (folder) => {
    return new Promise(resolve => {
      Promise.all(folder.map(async (item) => {
        return await collect(item)
      })).then(asd => {
        const x = {}
        asd.map(item => {
          const zz = Object.keys(item).pop()
          x[zz] = item[zz]
        })
        resolve(x)
      })
    })
  }

  const extracted = async (page) => {
    return new Promise(resolve => {
      const bracket = []
      Promise.all(Object.keys(page).map(async (section) => {
        if (['pages', 'categories'].indexOf(section) > -1) {
          return bracket.push(
            await page[section]
          )
        }
      })).then(res => {
        console.log(bracket)
      })
    })
  }

  const page = await listPages(FOLDER)
  const asdasd = await extracted(page)


  // if (['categories', 'pages'].indexOf(item) > -1) {
  //   await getPosts(data)
  //   await create(data)
  // }
  // await themes()
  // await fs.writeFileSync(path.resolve(DATA, 'posts.json'), JSON.stringify(posts, false, 2))
}