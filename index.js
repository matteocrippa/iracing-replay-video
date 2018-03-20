// require
const convert = require('xml-js');
const generator = require('./lib/generator');
const driver = require('./lib/driver');
const utils = require('./lib/utils');
const track = require('./lib/track');
const ui = require('./lib/ui');
const movie = require('./lib/movie.js');

// load data file
const jsonFile = require('fs').readFileSync('convert/data.xml', 'utf8');
const options = {
  compact: true,
  spaces: 4,
  trim: true,
  nativeType: true,
  alwaysArray: false
};
const json = JSON.parse(convert.xml2json(jsonFile, options));

// unwrap data
const leaderBoards = json.OverlayData.LeaderBoards;
const camDrivers = json.OverlayData.CamDrivers;
const fastestLaps = json.OverlayData.FastestLaps;
const messageStates = json.OverlayData.MessageStates;
const sessionData = json.OverlayData.SessionData;
const sessionInfo = sessionData.SessionInfo;

const data = {};

// load extra
//utils.cleanUpTmps()

// generate data
console.log('🚗 - Generating driver list');
data.drivers = driver.generateDriverList(sessionData);
console.log('🛣 - Generating track info');
data.track = track.generateTrackData(sessionData);
console.log('🏁 - Generating driver standings');
data.standings = generator.generateLeaderBoards(leaderBoards.LeaderBoard, data, camDrivers);

// prepare qualify data
data.session = {};
data.session.qualify = sessionInfo.Sessions._Sessions[1].ResultsPositions._ResultsPositions;
console.log('🏁 - Generating Qualify standings');
data.qualify = generator.generateSessionData(data, true);

// prepare race data
data.session.race = sessionInfo.Sessions._Sessions[2].ResultsPositions._ResultsPositions;
console.log('🏁 - Generating Racing standings');
data.race = generator.generateSessionData(data, false);


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

// preparing video
console.log('🎥 - Preparing Video');
movie.prepareVideo(data);