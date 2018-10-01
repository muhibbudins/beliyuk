# 🍀 HALSA — WIP

On development don't use it — Simple static site generator using markdown for the content, this project using **[from-mark](https://github.com/muhibbudins/from-mark)** to compile markdown file to html file.

## Why HALSA?

Halsa is acronym of "Halaman Statis" (Indonesian), which mean "Static Page" on english.

## Feature

- [x] Create project
- [x] Serve project
- [x] Watching change
- [x] Hot reload
- [ ] Custom html
- [ ] Using theme
- [ ] Custom port
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
halsa create <project name>
```

Or, if you're already create new directory just run inside a directory

```
halsa create .
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

## License

This project under MIT License