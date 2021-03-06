var driver = require('./driver');
var utils = require('./utils');
var _ = require('underscore');

// generate the leaderboars
exports.generateLeaderBoards = function (session, data, camDrivers, configuration) {
  var boards = [];
  var lastTime = 0.0;

  session.forEach(function (value) {
    var currentTime = parseFloat(value.StartTime._text);
    var order = [];
    var cdoc = -1;

    cdoc = driver.currentDriverOnCamera(currentTime, lastTime, camDrivers);
    //console.log(cdoc);

    value.Drivers.Driver.forEach(function (current) {
      var driverData = driver.getDriverByCarNumber(current.CarNumber._text, data.drivers);
      var d = {
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
      event: {
        incident: false,
        battle: false
      },
      order: order
    });

    lastTime = currentTime;
  });

  // set end value
  boards = setEndTime(boards);

  // populate fastest laps
  if (configuration.fastestLap.active) {
    boards = populateFastestLap(boards, data.fastest, configuration);
  }

  // populate extra info
  if (configuration.incidents.active) {
    boards = populateExtra(boards, data.events);
  }

  // optimize remove duplicates and aggregate = less images to generate
  boards = optimizeLeaderBoards(boards);

  // name images
  boards = nameImages(boards);

  //console.log(boards);
  return boards;
};

// populate name field for images
function nameImages(boards) {
  var i = 0;
  boards.forEach(function(b){
    b.filename = '../tmp/lb-' + i + '.png';
    i += 1;
  });
  return boards;
}

// populate extra (yellow flags, battles)
function populateExtra(boards, events) {

  // loop race events
  events.forEach(function (event) {

    var ff = {
      start: parseFloat(event.StartTime._text),
      end: parseFloat(event.EndTime._text),
      isIncident: (event.Interest._text.toLowerCase() === "incident"),
      isBattle: (event.Interest._text.toLowerCase() === "battle")
    };

    _.filter(boards, function (item) {
      return (item.start >= ff.start && item.end < ff.end)
    }).forEach(function (item) {
      // set yellow flag
      item.event.incident = ff.isIncident;
      item.event.battle = ff.isBattle;
    });

  });

  return boards;
}

// populate fastest lap value
function populateFastestLap(boards, fastest, configuration) {

  var fast = [];
  var lastFrame = boards[boards.length - 1].start;
  var last = 0;

  // turns fastest lap data "usable"
  fastest.forEach(function (f) {
    var car = f.Driver.CarNumber._text;
    var laptime = utils.convertTimeToRacing(f.Time._text);
    var when = parseFloat(f.StartTime._text);

    if (fast.length > 0) {
      var prev = fast[fast.length - 1];
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
  fast.forEach(function (ff) {

    _.filter(boards, function (item) {
      return (item.start >= ff.start && item.end < ff.end)
    }).forEach(function (item) {
      // set the fastest lap owner
      var fl = _.find(item.order, function (it) {
        return it.driver.number === ff.car
      });
      fl.isFastestLap = true;
      // force showing full time only for few seconds
      if (item.start <= (ff.start + configuration.fastestLap.visibleFor)) {
        fl.fastestLap = ff.time;
      }
    });

  });

  return boards;
}

// optimize removing duplicates
function optimizeLeaderBoards(boards) {
  //console.log(boards.length);
  var tmp = [];
  tmp.push(boards[0]);

  boards.forEach(function (b) {
    var a = tmp[tmp.length - 1];

    if(isDifferent(a, b)) {
      a.end = b.start;
      tmp.push(b);
    }

  });
  //console.log(tmp.length);
  return tmp;
}

// check if a board is different from another
function isDifferent(a, b) {
  return JSON.stringify(_.pluck(a.order, 'driver')) !== JSON.stringify(_.pluck(b.order, 'driver')) || a.lap !== b.lap || a.event.incident !== b.event.incident
}

// add end time to leaderboards entries
function setEndTime(boards) {
  for (var i = 0; i < boards.length; i++) {
    if (i < boards.length - 1) {
      var next = boards[i + 1];
      boards[i].end = next.start;
    }
  }
  return boards;
}


// generate session data
exports.generateSessionData = function (data, isQualify) {
  var session = [];
  var first = -1;

  var sessionData = data.session.race;
  if (isQualify) {
    sessionData = data.session.qualify;
  }

  sessionData.forEach(function (driverData) {
    var d = {
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

// generate race commentary
exports.generateCommentary = function(data) {
  var voices = [];
  var last = 0;
  data.forEach(function(d){
    var text = '';
    if(Array.isArray(d.Messages.string)) {
      text = d.Messages.string[d.Messages.string.length - 1]._text;
    } else {
      text = d.Messages.string._text;
    }
    // skip if too close to the previous
    if(last+3 < d.Time._text) {
      last = parseFloat(d.Time._text);
      voices.push({
        "file": voices.length+".mp3",
        "text": text,
        "start": last
      });
    }

  });
  return voices;
};