// require
const convert = require('xml-js');
const generator = require('../lib/generator');
const driver = require('../lib/driver');
const track = require('../lib/track');
const fs = require('fs');

// load data file
const jsonFile = require('fs').readFileSync('input/data.xml', 'utf8');
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

// dump data
console.log('✅ - Json file written');
fs.writeFile('./tmp/data.json', JSON.stringify(data, null, 4));