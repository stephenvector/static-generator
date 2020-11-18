import chokidar from "chokidar"
import yargs from "yargs"
import marked from "marked"
import matter from "gray-matter"
import browserSync from "browser-sync"
import { minify } from "html-minifier"
import autoprefixer from "autoprefixer"
import postcss from "postcss"

const bs = browserSync.create();

const HTML_TEMPLATE = `<!doctype html>
<html>
<head>
{{HEAD}}
</head>
<body>
{{BODY}}
</body>
</html>
`;

bs.init({
  server: "public",
  serveStatic: ['public'],
  files: ["**/*.html"],
  ui: false,
  logLevel: "silent",
  notify: false
})

console.log(yargs(process.argv.slice(2)).argv)
