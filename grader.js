#!/usr/bin/env node

/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var restler = require('restler');

var HTMLFILE_DEFAULT = 'index.html';
var CHECKSFILE_DEFAULT = 'checks.json';

var assertFileExists = function(infile) {
  var instr = infile.toString();
  if (!fs.existsSync(instr)) {
    console.log('%s does not exist. Exiting.', instr);
    process.exit(1);
  }
  return instr;
};

var loadChecks = function(checksfile) {
  return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtml = function(html, checksfile) {
  var $ = cheerio.load(html);
  var checks = loadChecks(checksfile).sort();
  var out = {};
  for (var ii in checks) {
    var selector = checks[ii];
    var present = $(selector).length > 0;
    out[selector] = present;
  }
  return out;
};

var clone = function(fn) {
  // Workaround for commander.js issue.
  // http://stackoverflow.com/a/6772648
  return fn.bind({});
};

var loadURL = function(url, callback) {
  restler.get(url).on('complete', function(result, response) {
    if (result instanceof Error) {
      callback(result);
    }
    else {
      callback(null, result);
    }
  });
};

var main = function(argv) {
  program
    .option('-c, --checks <check_file>', 'Path to checks.json',
        clone(assertFileExists), CHECKSFILE_DEFAULT)
    .option('-f, --file <html_file>', 'Path to index.html',
        clone(assertFileExists), HTMLFILE_DEFAULT)
    .option('-u, --url <html_url>', 'URL to HTML file')
    .parse(argv);

  var loadHtml = (program.url)
    ? (function(cb) { loadURL(program.url, cb); })
    : (function(cb) { fs.readFile(program.file, cb); });

  loadHtml(function(error, html) {
    if (error) {
      console.error(error);
      process.exit(1);
    }
    var checkJson = checkHtml(html, program.checks);
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
  });
};

if (module === require.main) {
  main(process.argv);
}
