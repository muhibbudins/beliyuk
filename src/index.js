(async () => {
  const fs = require('fs')
  const fx = require('fs-extra')
  const path = require('path')
  const glob = require('glob')
  const mark = require('markdown').markdown
  const pretty = require('pretty')

  const ROOT = __dirname
  const PROJECT = process.cwd()
  const BUILD = path.resolve(PROJECT, '.halsa')
  const LAYOUT = path.resolve(PROJECT, 'layouts')
  const THEME = path.resolve(PROJECT, 'themes')
  const DATA = path.resolve(BUILD, 'data')
  const FOLDER = ['categories', 'layouts', 'pages', 'themes']

  if (!fs.existsSync(BUILD)) {
    fs.mkdirSync(BUILD)
  }

  if (!fs.existsSync(DATA)) {
    fs.mkdirSync(DATA)
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

          if (['pages', 'categories'].indexOf(section) > -1) {
            data['route'] = item.replace(/pages|categories/, '').replace(/md|mdx/g, 'html')
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
      glob(`${section}/**/*`, async (err, files) => {
        const data = await extract(files, section)
        resolve(data)
      })
    })
  }

  // TODO Create File
  const create = async (files) => {
    files.map(file => {
      const lay = path.join(LAYOUT, `${file['detail']['layout']}.html`)
      const laz = fs.readFileSync(lay, 'utf-8')
      const mad = fs.readFileSync(file['path'], 'utf-8')
      const set = file['route'].split('/')
      const la = file['route'].replace(set.splice(-1, 1).join(''), '')
      const xa = path.join(BUILD, la)
      const ya = path.join(BUILD, file['route'])

      if (!fs.existsSync(xa)) {
        fx.mkdirpSync(xa)
      }

      fs.writeFileSync(ya, pretty(laz.replace('{{ content }}', mark.toHTML(mad))))
    })
  }

  FOLDER.map(async (item) => {
    const FILE = path.resolve(DATA, `${item}.json`)
    const data = await collect(item)

    if (['categories', 'pages'].indexOf(item) > -1) {
      await create(data)
    }

    fs.writeFileSync(FILE, JSON.stringify(data, false, 2))
  })

})()