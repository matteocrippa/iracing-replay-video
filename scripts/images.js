// require
var ui = require('../lib/ui');
var path = require('path');
var fs = require('fs');

// retrieve json data
var data = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../tmp/data.json'), 'utf8'));

// get banner image
if(fs.existsSync(path.resolve(__dirname, '../input/banner.jpg'))) {
  var image_data = fs.readFileSync(path.resolve(__dirname, '../input/banner.jpg'));
  data.banner = new Buffer(image_data, 'binary').toString('base64');
}

// intro image
console.log('🎨 - Paiting Intro Image');
ui.generateIntroImage(data);

// leaderboards images
console.log('‍🎨 - Paiting Leaderboards Image');
ui.generateLeaderboardImages(data);

// qualify image
console.log('‍🎨 - Paiting Qualify Image');
ui.generateEndSessionImage(data, true);

// race image
console.log('🎨 - Paiting Race Image');
ui.generateEndSessionImage(data, false);

console.log('✅ - Images generated');
