// require
var movie = require('../lib/movie.js');
var fs = require('fs');
var path = require('path');

var data = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../tmp/data.json'), 'utf8'));

// preparing video
console.log('🎥 - Preparing Video');
movie.prepareVideo(data);