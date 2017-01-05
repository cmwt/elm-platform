var binstall = require("binstall");
var path = require("path");
var fs = require("fs");
var packageInfo = require(path.join(__dirname, "package.json"));

// Use major.minor.patch from version string - e.g. "1.2.3" from "1.2.3-alpha"
var binVersion = packageInfo.version.replace(/^(\d+\.\d+\.\d+).*$/, "$1");

// 'arm', 'ia32', or 'x64'.
var arch = process.arch;

// 'darwin', 'freebsd', 'linux', 'sunos' or 'win32'
var operatingSystem = process.platform;

var filename = operatingSystem + "-" + arch + ".tar.gz";
var url = "https://dl.bintray.com/elmlang/elm-platform/"
  + binVersion + "/" + filename;

var binariesDir = path.join(__dirname, "binaries");

binstall(url, {path: binariesDir, strip: 1}, {verbose: true})
  .then(checkBinariesPresent).then(function(successMessage) {
    console.log(successMessage);
  }, function(errorMessage) {
    console.error(errorMessage);
    process.exit(1);
  });

var packageInfo = require(path.join(__dirname, "package.json"));
var executables = Object.keys(packageInfo.bin);
var binaryExtension = process.platform === "win32" ? ".exe" : "";
var executablePaths = {};

executables.forEach(function(executable) {
  executablePaths[executable] = path.join(binariesDir, executable + binaryExtension);
});

function checkBinariesPresent(successMessage) {
  return new Promise(function(resolve, reject) {
    Promise.all(
      executables.map(function(executable) {
        var executablePath = executablePaths[executable];

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
    ).then(function() {
      resolve(successMessage);
    }).catch(reject);
  });
}
