import express from "express";
import ws from "ws";
import path from "path";
import chokidar from "chokidar";
import marked from "marked";
import matter from "gray-matter";
import fs from "fs";

type WebPage = {
  slug: string;
  indexPath: string;
  title: string;
  markdown: string;
  html: string;
};

const webpages: WebPage[] = [];

const BASE_PATH = process.cwd();

async function processWebpageFile(filePath: string) {
  const t = fs.readFileSync(filePath);
  const m = matter(t.toString());
  const fileMarkdown = m.content;
  const fileHTML = marked(fileMarkdown);
  const matterSlug = m.data.slug;
  const parsedRelativePath = path.parse(filePath.replace(BASE_PATH, ""));
  const filePathSlug = parsedRelativePath.name.toLowerCase();
  const webpageSlug =
    typeof matterSlug === "string" ? matterSlug : filePathSlug;
  const indexPath = `/${webpageSlug}/index.html`;
  if (matterSlug) {
    webpages.push({
      slug: webpageSlug,
      html: fileHTML,
      markdown: fileMarkdown,
      indexPath,
      title: m.data.title,
    });
  }
}

chokidar
  .watch([`${process.cwd()}/**/*.md`], {
    ignored: [/(^|[\/\\])\../, /node_modules/],
    persistent: true,
  })
  .on("all", (event, markdownFilePath) => {
    processWebpageFile(markdownFilePath.toString());
  })
  .on("ready", () => {
    console.log("ready");
  });

const app = express();

app.get("/client.js", (req, res) => {
  res.statusCode = 200;
  res.header("Content-Type", "text/javascript");
  res.write(`
  console.log("FART")
  const socket = new WebSocket("ws://localhost:3000/")
  socket.addEventListener('open', function (event) {
      socket.send('Hello Server!');
  });
  socket.addEventListener('message', function (event) {
      console.log('Message from server ', event.data);
  });
  `);
  res.end();
});

export const HTML_TEMPLATE = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<script src="http://localhost:3000/client.js" type="text/javascript"></script>
</head>
<body></body>
</html>
`;

app.get("/", (req, res, next) => {
  if (webpages.length === 0) {
    return next();
  }

  const links: string[] = [];

  webpages.forEach((page) => {
    links.push(
      `<a href="${page.indexPath.replace("index.html", "")}">${page.title}</a>`
    );
  });

  console.log(webpages);

  res.send(HTML_TEMPLATE.replace("<body>", `<body>${links.join(" ")}`));
});

app.use((req, res, next) => {
  if (Object.keys(webpages).length === 0) {
    return next();
  }

  console.log(req.url);

  const webpageFound = webpages.find(
    (wp) => wp.indexPath.replace("index.html", "") === req.url
  );

  console.log(webpageFound);

  if (!webpageFound) {
    return next();
  }

  res.send(
    HTML_TEMPLATE.replace(
      "<body>",
      `<body><h1>${webpageFound.title}</h1>${webpageFound.html}`
    )
  );
});

const wsServer = new ws.Server({ noServer: true });
wsServer.on("connection", (socket) => {
  socket.on("message", (message) => console.log(message));
});

const server = app.listen(3000);
server.on("upgrade", (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (socket) => {
    wsServer.emit("connection", socket, request);
  });
});
