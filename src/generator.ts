import path from "path";
import fs from "fs";
import stream from "stream";
import http from "http";
import readline from "readline";
import net from "net";
import url from "url";

const server = http.createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/html; utf-8" });
  response.write(request.url);
  console.log(url.parse(request.url || ""));
  console.log(path.parse(request.url || ""));
  response.end();
});

server.listen(3000);

const websocketServer = net
  .createServer((socket) => {
    socket.on("data", (data) => {
      console.log(data.toString());
    });
    socket.write("SERVER: Hello! This is server speaking.<br>");
    socket.end("SERVER: Closing connection now.<br>");
  })
  .on("error", (err) => {
    console.error(err);
  });

websocketServer.listen(9898, () => {
  const address = websocketServer.address();
  if (address) {
    console.log(address);
  }
});

enum CurrentBlock {
  Code = "Code",
  None = "None",
}

const leafBlocksMap = {
  "# ": "h1",
  "## ": "h2",
  "### ": "h3",
  "#### ": "h4",
  "##### ": "h5",
  "###### ": "h6",
  "***": "<hr />",
  "---": "<hr />",
  [`___`]: "<hr />",
};

function markdownToHTML(markdownString: string) {
  let html = "";
  const markdownStream = stream.Readable.from(markdownString);
  const rl = readline.createInterface(markdownStream);
  let currentBlock: CurrentBlock = CurrentBlock.None;
  rl.on("line", (line) => {
    if (line.trim().indexOf("# ") === 0) {
      html += `<h1>${line.slice(2)}</h1>`;
    }
  });
}
