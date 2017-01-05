var path = require("path");
var platform = require(path.join(__dirname, "platform"));
var fs = require("fs");
var request = require("request");
var tar = require("tar");
var zlib = require("zlib");
var distDir = platform.distDir;
var binariesDir = path.join(__dirname, "binaries");
var shareReactorDir = platform.shareReactorDir;

function checkBinariesPresent() {
  return Promise.all(
    platform.executables.map(function(executable) {
      var executablePath = platform.executablePaths[executable];

      return new Promise(function(resolve, reject) {
        fs.stat(executablePath, function(err, stats) {
          if (err) {
            reject(executable + " was not found.");
          } else if (!stats.isFile()) {
            reject(executable + " was not a file.");
          } else {
            resolve();
          }
        });
      });
    })
  );
}

function downloadBinaries() {
  return new Promise(function(resolve, reject) {
    // 'arm', 'ia32', or 'x64'.
    var arch = process.arch;

    // 'darwin', 'freebsd', 'linux', 'sunos' or 'win32'
    var operatingSystem = process.platform;

    var filename = operatingSystem + "-" + arch + ".tar.gz";
    var url = "https://dl.bintray.com/elmlang/elm-platform/"
      + platform.elmVersion + "/" + filename;

    var untar = tar.Extract({path: path.join(__dirname, "binaries"), strip: 1})
        .on("error", function(error) {
          reject("Error extracting " + filename + " - " + error);
        })
        .on("end", function() {
          resolve("Successfully downloaded and processed " + filename);
        });

    var gunzip = zlib.createGunzip()
        .on("error", function(error) {
          reject("Error decompressing " + filename + " " + error);
        });

    request.get(url, function(error, response) {
      if(error) {
        reject("Error communicating with URL " + url + " " + error);
        return;
      }
      if (response.statusCode == 404) {
        reject("Unfortunately, there are currently no Elm Platform binaries available for your operating system and architecture.\n\nIf you would like to build Elm from source, there are instructions at https://github.com/elm-lang/elm-platform#build-from-source\n");
        return;
      }

      console.log("Downloading Elm binaries from " + url);

      response.on("error", function(error) {
        reject("Error receiving " + url);
      });
    }).pipe(gunzip).pipe(untar);
  });
}

downloadBinaries().then(function(successMessages) {
  successMessages.forEach(function(message) {
    console.log(message);
  })
}, function(errorMsg) {
  console.error(errorMsg);
  process.exit(1);
});
