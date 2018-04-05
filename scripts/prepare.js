// require
var convert = require('xml-js');
var generator = require('../lib/generator');
var driver = require('../lib/driver');
var track = require('../lib/track');
var fs = require('fs');

// load data file
var jsonFile = require('fs').readFileSync('input/data.xml', 'utf8');
var options = {
  compact: true,
  spaces: 4,
  trim: true,
  nativeType: false,
  alwaysArray: false
};
var json = JSON.parse(convert.xml2json(jsonFile, options));

// unwrap data
var leaderBoards = json.OverlayData.LeaderBoards.LeaderBoard;
var camDrivers = json.OverlayData.CamDrivers;
var fastestLaps = json.OverlayData.FastestLaps.FastLap;
var messageStates = json.OverlayData.MessageStates.MessageState;
var sessionData = json.OverlayData.SessionData;
var sessionInfo = sessionData.SessionInfo.Sessions;
var raceEvents = json.OverlayData.RaceEvents.RaceEvent;

// data
var data = {};
data.session = {};

// TODO: improve and use as a param
// configuration stuff
var configuration = {
  fastestLap: {
    visibleFor: 40,
    active: true
  },
  pit: {
    active: true
  },
  incidents: {
    active: true
  },
  commentary: {
    active: true
  }
};

// generate data
data.drivers = driver.generateDriverList(sessionData);
console.log('🚗  - Generated driver list');

data.track = track.generateTrackData(sessionData);
console.log('🛣  - Generated track info');

data.events = raceEvents;
data.fastest = fastestLaps;
data.standings = generator.generateLeaderBoards(leaderBoards, data, camDrivers, configuration);
console.log('👬 - Generated driver standings ('+data.standings.length+')');

// prepare qualify data
data.session.qualify = sessionInfo._Sessions[1].ResultsPositions._ResultsPositions;
data.qualify = generator.generateSessionData(data, true);
console.log('🚩 - Generated Qualify standings');

// prepare race data
data.session.race = sessionInfo._Sessions[2].ResultsPositions._ResultsPositions;
data.race = generator.generateSessionData(data, false);
console.log('🏁 - Generated Racing standings');

// prepare race texts
if(configuration.commentary.active) {
  data.commentary = generator.generateCommentary(messageStates);
  console.log('👨‍🎤 - Generated Racing commentary');
}

// dump data
console.log('✅ - Json file written');
fs.writeFile('./tmp/data.json', JSON.stringify(data, null, 4));