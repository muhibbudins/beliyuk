const template = require('template7')

module.exports = () => {
  template.registerHelper('h_navbar', (data) => {
    return `
      <nav class="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
        <div class="container">
          <a class="navbar-brand" href="/">${data['name']}</a>
          <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavDropdown-1" aria-controls="navbarNavDropdown-1" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarNavDropdown-1">
            <ul class="navbar-nav ml-auto">
              ${data['menu'].map(item => {
                return `
                  <li class="nav-item">
                    <a class="nav-link" href="${item['url']}">${item['title']}</a>
                  </li>
                `
              }).join('')}
            </ul>
          </div>
        </div>
      </nav>
    `
  })

  template.registerHelper('h_menu', (data) => {
    return `
      <ul class="navbar-nav ml-auto">
        ${data.map(item => {
          return `
            <li class="nav-item">
              <a class="nav-link" href="${item['url']}">${item['title']}</a>
            </li>
          `
        }).join('')}
      </ul>
    `
  })

  template.registerHelper('h_footer', (data) => {
    return `
      <footer class="main-footer py-5">
        <p class="text-muted text-center small p-0 mb-4">© Copyright ${new Date().getFullYear()} — ${data['name']}</p>
      </footer>
    `
  })

  template.registerHelper('h_posts', (data, options) => {
    let limit = 1

    if (options['hash'] && options['hash']['limit']) {
      limit = options['hash']['limit']
    }
    return `
      <div class="row">
        ${data.slice(0, limit).map(item => {
          return `
            <div class="col-4">
              <div class="card">
                <img class="card-img-top" src="${item['content']['image']}" alt="Card image cap">
                <div class="card-body">
                  <h4 class="card-title">${item['content']['title']}</h4>
                  <p class="card-text">${item['content']['description']}</p>
                  <a href="${item['content']['route']}" class="btn btn-primary">Read More</a>
                </div>
              </div>
            </div>
          `
        }).join('')}
      </div>
    `
  })
}