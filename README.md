# 🍀 HALSA

Simple static site generator using markdown for the content.

## Why HALSA?

Halsa is acronym of "Halaman Statis" (Indonesian), which mean "Static Page" on english.

## Feature

- [x] Create project
- [x] Serve project
- [x] Watching change
- [x] Hot reload
- [x] Custom html
- [x] Using theme
- [x] Custom port
- [ ] So on.

## Usage

First, install **Halsa CLI** using

```
npm i -g halsa
```

And then, follow instruction below :

### Create new project

Just run this command to create new project

```
halsa new <project name>
```

Or, if you're already create new directory just run inside a directory

```
halsa new .
```

### Serve project

Run this project to serve project on port 3000

```
halsa start <project name>
```

Or, if you're inside a project just run

```
halsa start .
```

### Documentations

#### Show Category

```html
  <div class="category">
    {{#each categories}}
      <div>{{name}}</div>
    {{/each}}
  </div>
```

## License

This project under MIT License
