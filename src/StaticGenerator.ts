import path from "path";
import marked from "marked";
import matter from "gray-matter";

console.log(process.argv);

export enum SiteGeneratorMode {
  Dev = "dev",
  Build = "build",
}

export const HTML_TEMPLATE = `<!doctype html>
<html>
<head>
{{HEAD}}
<style type="text/css">{{CSS}}</style>
</head>
<body>
{{BODY}}
</body>
</html>
`;

export default class SiteGenerator {
  public cssPaths: string[];
  public markdownPaths: string[];
  public watcher: chokidar.FSWatcher;
  public siteCSS: { [filePath: string]: string } = {};
  public bs: browserSync.BrowserSyncInstance;

  constructor() {
    this.cssPaths = [];
    this.markdownPaths = [];
    this.siteCSS = {};
    this.bs = browserSync.create();

    this.watcher = chokidar.watch(["./**/*.md", "./**/*.css"], {
      ignored: [/^node_modules/, /^coverage/, /^public/, /^build/],
    });

    this.watcher.on("any", this.onAny.bind(this));
    this.watcher.on("ready", this.onReady.bind(this));

    this.startBrowserSync();
  }

  minifyHTML(htmlString: string) {
    return minify(htmlString, {
      collapseWhitespace: true,
      removeEmptyAttributes: true,
      removeEmptyElements: false,
    });
  }

  startBrowserSync() {
    this.bs.init({
      server: "public",
      serveStatic: ["public"],
      files: ["**/*.html"],
      ui: false,
      logLevel: "silent",
      notify: false,
    });
  }

  async stopBrowserSync() {
    this.bs.cleanup();
  }

  async onReady() {
    await fs.ensureDir(path.resolve(__dirname, "public"));

    const siteCSSMerged: string = Object.values(this.siteCSS)
      .map((cssString) => cssString)
      .join("");

    // console.log(siteCSSMerged);
  }

  processMarkdown(markdownContent: string) {
    const parsed = matter(markdownContent);

    const htmlMarkup = marked(parsed.content, {
      headerIds: false,
    });
  }

  async onAny(filePath: string) {
    const fileMimeType = mime.lookup(filePath);
    if (!fileMimeType) return;
    const fileExtension = mime.extension(fileMimeType);

    if (fileExtension === "css") {
      const content = fs.readFileSync(filePath);
      const cssString = content.toString();
      this.siteCSS[filePath] = cssString;
    } else if (fileExtension === "markdown") {
      const content = fs.readFileSync(filePath);
      const markdownString = content.toString();
      const result = this.processMarkdown(markdownString);
      // this.[filePath] = result;
    }
  }
}
