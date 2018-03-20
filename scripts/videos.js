// require
const movie = require('../lib/movie.js');
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../tmp/data.json'), 'utf8'));

// preparing video
console.log('🎥 - Preparing Video');
movie.prepareVideo(data);