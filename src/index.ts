import * as fs from "fs";
import * as path from "path";

async function readDirectory(dirPath: string) {
  return new Promise((resolve, reject) => {
    fs.readdir(
      dirPath,
      { encoding: "utf-8", withFileTypes: true },
      (err, files) => {
        if (err) {
          return reject(err);
        }

        files.forEach((file) => {
          if (file.isFile()) {
            fs.statSync(path.resolve(dirPath, file.name));
            console.log(file.name);
          } else if (file.isDirectory()) {
            readDirectory(path.resolve(dirPath, file.name));
          }
        });
      }
    );
  });
}

readDirectory(path.resolve(__dirname, "../"));
