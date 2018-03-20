/*
You can do a simple image overlay using the following syntax:

ffmpeg -i input.mp4 -i image.png \
-filter_complex "[0:v][1:v] overlay=25:25:enable='between(t,0,20)'" \
-pix_fmt yuv420p -c:a copy \
output.mp4
overlay=25:25 means we want to position the image 25px to the right and 25px down, originating from the top left corner (0:0).

enable='between(t,0,20)' means we want the image to show between second 0 and 20.

[0:v][1:v] means that we want the first video file we import with -i, in our case input.mp4 or how ffmpeg sees it video input file number 0, to be under video input file 1, in our case image.png. :v just means we want video 0 and video 1. [0:a] would mean we want the first imported audio track. Which would also come from input.mp4 but would point to the audio track instead of the video track in the mp4 file.

If you want a certain image quality/settings and not the settings ffmpeg chooses, add the image and or audio encoding options you want to use. The default video encoder will be x264. Check the H.264 encoding guide for possible settings.

The -acodec copy / -c:a copy that you have in your command f.e. would simply re-use the audio from the source file. Though you can't do that with the video of course (in this case), that has to be transcoded because we are creating a new video source.

If you want to transcode audio, remove the -c:a copy part. You may have to explicitly specify an encoder, e.g. -c:a aac -strict experimental. See the AAC encoding guide for more info.
 */

// require
const convert = require('xml-js');
const ejs = require('ejs');
const webshot = require('webshot');
const _ = require('underscore');

// load data file
const json = require('fs').readFileSync('convert/data.xml', 'utf8');
const options = {
  compact: true,
  spaces: 4,
  trim: true,
  nativeType: true,
  alwaysArray: false
};
const data = JSON.parse(convert.xml2json(json, options));

// determine data structure
const leaderBoards = data.OverlayData.LeaderBoards;
const camDrivers = data.OverlayData.CamDrivers;
const fastestLaps = data.OverlayData.FastestLaps;
const messageStates = data.OverlayData.MessageStates;
const sessionData = data.OverlayData.SessionData;
const sessionInfo = sessionData.SessionInfo;


// cleanup tmp
function cleanUpTmps() {
  // TODO: add way to easy cleanup libs
}
cleanUpTmps()

// generate list of drivers
function generateDriverList(session) {
  const drivers = [];
  session.DriverInfo.Drivers._Drivers.forEach(function(driver){
    drivers.push({
      fullname: driver.UserName._text.replace(/[0-9]/g, ''),
      surname: _.last(driver.UserName._text.split(" ")).replace(/[0-9]/g, ''),
      initial: driver.Initials ? driver.Initials._text : '',
      number: driver.CarNumber._text,
      userid: driver.UserID._text,
      idx: driver.CarIdx._text,
      car: driver.CarScreenName._text,
      nationality: '' // TODO: this would be nice for flags
    });
  });

  //console.log(drivers);
  return drivers;
}
const drivers = generateDriverList(sessionData);

// get driver by car number
function getDriverByCarNumber(number) {
  return drivers.filter(function(driver) { return driver.number === number })[0];
}
function getDriverById(id) {
  return drivers.filter(function(driver) { return driver.idx === id })[0];
}

// create intro screen
function generateTrackData(session) {
  const track = {};
  track.name = session.WeekendInfo.TrackDisplayName._text;
  track.length = session.WeekendInfo.TrackLength._text;
  track.city = session.WeekendInfo.TrackCity._text;
  track.country = session.WeekendInfo.TrackCountry._text;
  track.weather = {};
  track.weather.temperature = {}
  track.weather.temperature.air = session.WeekendInfo.TrackAirTemp._text;
  track.weather.temperature.track = session.WeekendInfo.TrackSurfaceTemp._text;
  track.weather.wind = {};
  track.weather.wind.speed = session.WeekendInfo.TrackWindVel._text;
  track.weather.wind.direction = session.WeekendInfo.TrackWindDir._text;

  //console.log(track);
  return track;
}
const track = generateTrackData(sessionData);

// retrieve current driver on camera
function currentDriverOnCamera(current, last, data) {
  const c = parseFloat(current);
  const l = parseFloat(last);
  var driver = 0;

  data.CamDriver.every(function(camera, index){
    const t = parseFloat(camera.StartTime._text);
    if(t>= l && t <=c) {
      driver = camera.CurrentDriver.CarNumber._text;
      return false;
    }
    return true;
  });

  return driver;
}


// generate the leaderboars
function generateLeaderBoards(data) {
  const boards = [];
  var lastTime = 0.0;

  var x = 0;

  data.forEach(function (value) {
    const currentTime = parseFloat(value.StartTime._text);
    const order = [];

    const cdoc = currentDriverOnCamera(currentTime, lastTime, camDrivers);
    //console.log(cdoc);

    // TODO: retrieve fastest lap time and who did it!

    value.Drivers.Driver.forEach(function(driver){
      const d = getDriverByCarNumber(driver.CarNumber._text);
      const data = {
        driver: d,
        isOnCamera: (d.number === cdoc),
        isFastestLap: false,
        fastestLap: 0,
        pit: driver.PitStopCount._text,
      };
      //console.log(data);
      order.push(data);
    });

    boards.push({
      start: currentTime,
      lap: value.RacePosition._text,
      order: order
    });

    lastTime = currentTime;
  });

  //console.log(boards);
  return boards;
}
const boards = generateLeaderBoards(leaderBoards.LeaderBoard);

function convertTimeToRacing(secsTemp) {

  if ( secsTemp < 0 ) {
    return '';
  }
  decimals = 3;
  var secs = secsTemp % 60;
  var mins = Math.floor(secsTemp/60);
  var leadZero = false;
  if ( secs < 10 - 0.5 * Math.pow(10,-1*decimals) ) {
    leadZero = true;
  }
  return mins + ':' + (leadZero ? '0' : '') + secs.toFixed(decimals);

}

function calculateGap(first, current) {
  const curr = parseFloat(current);
  const gap = curr - first;
  if(first > -1) {
    return "+" + convertTimeToRacing(gap);
  } else {
    return "+0.000";
  }
}

// prepare session data
function generateSessionData(data) {
  const session = [];

  var first = -1;

  data.forEach(function(driver){
    const d = {
      position: driver.Position._text,
      driver: getDriverById(driver.CarIdx._text),
      time: convertTimeToRacing(driver.Time._text), // convert
      gap: calculateGap(first, driver.Time._text), // calculate gap
      fastest: {
        lap: driver.FastestLap._text,
        time: convertTimeToRacing(driver.FastestTime._text)
      },
      lap: {
        lap: driver.Lap._text,
        led: driver.LapsLed._text,
        complete: driver.LapsComplete._text,
        driven: driver.LapsDriven._text,
      }
    };
    session.push(d);
    if (first === -1) {
      first = parseFloat(driver.Time._text);
    }
  });

  //console.log(session);
  return session;
}

const qualifyInfo = generateSessionData(sessionInfo.Sessions._Sessions[1].ResultsPositions._ResultsPositions);
const raceInfo = generateSessionData(sessionInfo.Sessions._Sessions[2].ResultsPositions._ResultsPositions);


// 59 seconds of intro
// use boards[0] and track
function generateIntroImage(track) {
  ejs.renderFile('./templates/intro.ejs', { data: track }, options, function(err, str){
      html2png(str, './tmp/intro.png');
  });
}
generateIntroImage(track);

function generateLeaderboardImages(standings, track) {
  var current = 0;
  standings.forEach(function(standings){

    ejs.renderFile('./templates/leaderboard-small.ejs', { standings: standings, track: track }, {}, function(err, html){
      if(html) {
        var filename = './tmp/lb-'+current+'.png';
        html2png(html, filename);
      } else {
        console.log(err);
      }
    });
    current += 1;
  });
}
// all laps small
//generateLeaderboardImages(boards, track);
// TODO: need to defer/optimize
generateLeaderboardImages([boards[91]], track);

// first and last big
function generateEndSessionImage(standings, track, isQualify) {
  var template = './templates/race.ejs';
  if (isQualify) {
    template = './templates/qualify.ejs';
  }
  ejs.renderFile(template, { standings: standings, track: track }, {}, function(err, html){
    if(html) {
      var filename = './tmp/lb-qualify.png';
      if(isQualify === false) {
        filename = './tmp/lb-race.png';
      }
      html2png(html, filename);
    } else {
      console.log(err);
    }
  });
}
generateEndSessionImage(qualifyInfo, track, true);
generateEndSessionImage(raceInfo, track, false);

// converts html to png image
function html2png(html, path) {
  webshot(html, path, { siteType: 'html' }, function(err) {
    if(err) {
      console.log(err);
    }
  });
}

// create N updated standings
//console.log(leaderBoards);