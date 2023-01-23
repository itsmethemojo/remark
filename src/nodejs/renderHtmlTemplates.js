var fs = require('fs')

require('dotenv').config();

// TODO find those dynamically
let files = ['index.html'];

files.forEach(function(file) {
  fs.readFile('src/' + file, 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    var resultData = data;
    Object.keys(process.env).forEach(function(key) {
      resultData = resultData.replace('{{ ' + key + ' }}', process.env[key]);
    });
    fs.writeFile('dist/' + file, resultData, 'utf8', function (err) {
       if (err) return console.log(err);
    });
  });
});
