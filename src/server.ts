import http from "http";
import fs from "fs";
import path from "path";
import url from "url";
import { EventEmitter } from "events";
import crypto from "crypto";

export const CLIENT_SIDE_WEBSOCKET_SCRIPT = `
console.log("FART")

const socket = new WebSocket("ws://localhost:3001/")

socket.addEventListener('open', function (event) {
    socket.send('Hello Server!');
});

socket.addEventListener('message', function (event) {
    console.log('Message from server ', event.data);
});
`;

const emitter = new EventEmitter();

emitter.on("ready", () => {
  console.log("READY");
});

export const DIRECTORY_NAMES_TO_IGNORE = [
  ".cache",
  ".git",
  ".vscode",
  "node_modules",
  "coverage",
];

export const HTML_TEMPLATE = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<script src="http://localhost:3000/client.js" type="text/javascript"></script>
{{HEAD}}
</head>
<body>
{{BODY}}
</body>
</html>
`;

export type DirectoryScanResults = {
  files: string[];
  directories: string[];
};

export type WebPage = {
  title: string;
  markdown: string;
};

async function scanDirectoryAsyncRecursive(
  directoryPath: string
): Promise<DirectoryScanResults> {
  const directoriesFound: string[] = [];
  const filesFound: string[] = [];

  const fileNames = await new Promise<string[]>((resolve, reject) => {
    fs.readdir(directoryPath, "utf-8", async (err, filenames) => {
      if (err) {
        reject(err);
      }
      resolve(filenames);
    });
  });

  for await (let filename of fileNames) {
    const filePath = path.resolve(directoryPath, filename);
    await new Promise((resolve) => {
      fs.stat(filePath, { bigint: true }, (err, stats) => {
        if (err) {
          console.error(err);
          return resolve();
        }

        if (
          stats.isDirectory() &&
          DIRECTORY_NAMES_TO_IGNORE.indexOf(filename) === -1
        ) {
          directoriesFound.push(filePath);
        }

        if (stats.isFile()) {
          filesFound.push(filePath);
        }

        resolve();
      });
    });
  }

  for await (let dp of directoriesFound) {
    const directoryPathFilesAndDirectories = await scanDirectoryAsyncRecursive(
      dp
    );

    directoryPathFilesAndDirectories.directories.forEach((d) => {
      directoriesFound.push(d);
    });

    directoryPathFilesAndDirectories.files.forEach((f) => {
      filesFound.push(f);
    });
  }

  return {
    directories: directoriesFound,
    files: filesFound,
  };
}

function watchDirectory(
  directoryPath: string,
  callback: (eventType: string, filename: string | Buffer) => void
) {
  const directoryPathWatcher = fs.watch(
    directoryPath,
    {
      encoding: "utf-8",
      recursive: false,
      persistent: true,
    },
    callback
  );

  return directoryPathWatcher;
}

function directoryEventCallback(eventType: string, filename: string | Buffer) {
  console.log(eventType, filename);
}

const server = http.createServer((req, res) => {
  if (req.method?.toLowerCase() === "get" && req.url !== undefined) {
    const parsedRequestURL = url.parse(req.url);
    console.log(JSON.stringify(parsedRequestURL));
    if (parsedRequestURL.path === "/client.js") {
      res.setHeader("Content-Type", "text/javascript");
      res.write(CLIENT_SIDE_WEBSOCKET_SCRIPT);
      res.end();
      return;
    }
  }

  console.log(req.headers);

  res.setHeader("Content-Type", "text/html");
  res.write(HTML_TEMPLATE);
  res.end();
});

const wsServer = http.createServer();

function generateAcceptValue(acceptKey: string) {
  return crypto
    .createHash("sha1")
    .update(acceptKey + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11", "utf8")
    .digest("base64");
}

wsServer.on("upgrade", (req, socket, head) => {
  socket.write(
    "HTTP/1.1 101 Web Socket Protocol Handshake\r\n" +
      "Upgrade: WebSocket\r\n" +
      "Connection: Upgrade\r\n" +
      "\r\n"
  );

  socket.pipe(socket); // echo back
});

wsServer.listen(3001);

server.listen(3000);

// scanDirectoryAsyncRecursive(process.cwd()).then(({ directories, files }) => {
//   const directoryWatchers = directories.map((dirPath) => {
//     const watcher = watchDirectory(dirPath, directoryEventCallback);
//     return {
//       path: dirPath,
//       watcher,
//     };
//   });

//   console.log(directoryWatchers.length);
// });

function parseYamlFrontMatter(frontMatterString: string) {
  const lines = frontMatterString.split(/\r?\n/);
  const linesWithoutBlanks = lines.filter((line) => line.trim().length > 0);
  console.log(linesWithoutBlanks.length);

  const yamlWrapperLineFirstIndex = linesWithoutBlanks.indexOf("---");
  const yamlWrapperSecondIndex = linesWithoutBlanks.indexOf(
    "---",
    yamlWrapperLineFirstIndex + 1
  );

  console.log(yamlWrapperLineFirstIndex, yamlWrapperSecondIndex);
}

parseYamlFrontMatter(`---
fart: ok
what:
  - fart
    - shoot
---`);
