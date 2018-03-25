const driver = require('./driver');
const utils = require('./utils');
const _ = require('underscore');

// generate the leaderboars
exports.generateLeaderBoards = function(session, data, camDrivers, configuration) {
  var boards = [];
  var lastTime = 0.0;

  session.forEach(function (value) {
    const currentTime = parseFloat(value.StartTime._text);
    const order = [];

    const cdoc = driver.currentDriverOnCamera(currentTime, lastTime, camDrivers);
    //console.log(cdoc);

    value.Drivers.Driver.forEach(function(current){
      const driverData = driver.getDriverByCarNumber(current.CarNumber._text, data.drivers);
      const d = {
        driver: driverData,
        isOnCamera: (driverData.number === cdoc),
        isFastestLap: false,
        fastestLap: 0,
        pit: 0,
        gap: 0 // TODO: populate gap
      };

      // add pit information
      if (configuration.pit.active) {
        d.pit = parseInt(current.PitStopCount._text);
      }

      //console.log(d);
      order.push(d);
    });

    boards.push({
      start: currentTime,
      end: 0,
      lap: value.RacePosition._text,
      flags: {
        yellow: false
      },
      order: order
    });

    lastTime = currentTime;
  });

  // optimize remove duplicates and aggregate = less images to generate
  boards = optimizeLeaderBoards(boards);

  // set end value
  boards = setEndTime(boards);

  // populate fastest lap
  if(configuration.fastestLap.active) {
    boards = populateFastestLap(boards, data.fastest, configuration);
  }

  // populate fastest lap
  if(configuration.incidents.active) {
    boards = populateYellowFlag(boards, data.events);
  }

  //console.log(boards);
  return boards;
};

// populate yellow flags
function populateYellowFlag(boards, events) {

  // loop race events
  events.forEach(function(event){

    const ff = {
      start: parseFloat(event.StartTime._text),
      end: parseFloat(event.EndTime._text),
      isIncident: (event.Interest._text === "Incidents")
    };

    _.filter(boards, function(item) {
      return ( item.start >= ff.start && item.end < ff.end )
    }).forEach(function (item) {
      // set yellow flag
      item.flags.yellow = ff.isIncident;
    });

  });

  return boards;
}

// populate fastest lap value
function populateFastestLap(boards, fastest, configuration) {

  const fast = [];
  const lastFrame = boards[boards.length-1].start;
  var last = 0;

  // turns fastest lap data "usable"
  fastest.forEach(function(f) {
    const car = f.Driver.CarNumber._text;
    const laptime = utils.convertTimeToRacing(f.Time._text);
    const when = parseFloat(f.StartTime._text);

    if(fast.length > 0){
      const prev = fast[fast.length-1];
      prev.end = when;
    }

    fast.push({
      car: car,
      time: laptime,
      start: when,
      end: lastFrame
    });

    last = when;

  });


  // apply fastest lap
  fast.forEach(function(ff) {

    _.filter(boards, function(item) {
      return ( item.start >= ff.start && item.end < ff.end )
    }).forEach(function (item) {
      // set the fastest lap owner
      const fl = _.find(item.order, function(it) { return it.driver.number === ff.car });
      fl.isFastestLap = true;
      // force showing full time only for few seconds
      if(item.start <= (ff.start + configuration.fastestLap.visibleFor)) {
        fl.fastestLap = ff.time;
      }
    });

  });

  return boards;
}

// optimize removing duplicates
function optimizeLeaderBoards(boards) {
  var tmp = [];
  tmp.push(boards[0]);

  boards.forEach(function(b) {
      const prev = tmp[tmp.length-1];
      if(JSON.stringify(prev.order) !== JSON.stringify(b.order) || prev.lap !== b.lap) {
        tmp.push(b);
      }
  });
  return tmp;
}

// add end time to leaderboards entries
function setEndTime(boards) {
  for(var i=0; i<boards.length; i++) {
    if (i < boards.length - 1) {
      const next = boards[i + 1];
      boards[i].end = next.start;
    }
  }
  return boards;
}


// generate session data
exports.generateSessionData = function(data, isQualify) {
  const session = [];
  var first = -1;

  var sessionData = data.session.race;
  if (isQualify) {
    sessionData = data.session.qualify;
  }

  sessionData.forEach(function(driverData){
    const d = {
      position: driverData.Position._text,
      driver: driver.getDriverById(driverData.CarIdx._text, data.drivers),
      time: utils.convertTimeToRacing(driverData.Time._text), // input
      gap: utils.calculateGap(first, driverData.Time._text), // calculate gap
      fastest: {
        lap: driverData.FastestLap._text,
        time: utils.convertTimeToRacing(driverData.FastestTime._text)
      },
      lap: {
        lap: driverData.Lap._text,
        led: driverData.LapsLed._text,
        complete: driverData.LapsComplete._text,
        driven: driverData.LapsDriven._text,
      }
    };
    session.push(d);
    if (first === -1) {
      first = parseFloat(driverData.Time._text);
    }
  });

  //console.log(session);
  return session;
};