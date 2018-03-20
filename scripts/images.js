// require
const ui = require('../lib/ui');
const utils = require('../lib/utils');
const path = require('path');
const fs = require('fs');

const data = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../tmp/data.json'), 'utf8'));

// load extra
utils.cleanUpTmps()

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
