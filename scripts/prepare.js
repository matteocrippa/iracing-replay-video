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
  nativeType: false,
  alwaysArray: false
};
const json = JSON.parse(convert.xml2json(jsonFile, options));

// unwrap data
const leaderBoards = json.OverlayData.LeaderBoards.LeaderBoard;
const camDrivers = json.OverlayData.CamDrivers;
const fastestLaps = json.OverlayData.FastestLaps.FastLap;
const messageStates = json.OverlayData.MessageStates;
const sessionData = json.OverlayData.SessionData;
const sessionInfo = sessionData.SessionInfo.Sessions;

const data = {};

// TODO: improve and use as a param
const configuration = {
  fastestLap: {
    visibleFor: 40,
    active: true
  },
  pit: {
    active: true
  }
};

// generate data
data.drivers = driver.generateDriverList(sessionData);
console.log('🚗  - Generated driver list');

data.track = track.generateTrackData(sessionData);
console.log('🛣  - Generated track info');

data.standings = generator.generateLeaderBoards(leaderBoards, data, camDrivers, fastestLaps, configuration);
console.log('👬 - Generated driver standings ('+data.standings.length+')');

// prepare qualify data
data.session = {};
data.session.qualify = sessionInfo._Sessions[1].ResultsPositions._ResultsPositions;
data.qualify = generator.generateSessionData(data, true);
console.log('🚩 - Generated Qualify standings');

// prepare race data
data.session.race = sessionInfo._Sessions[2].ResultsPositions._ResultsPositions;
data.race = generator.generateSessionData(data, false);
console.log('🏁 - Generated Racing standings');

// dump data
console.log('✅ - Json file written');
fs.writeFile('./tmp/data.json', JSON.stringify(data, null, 4));