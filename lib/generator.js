const driver = require('./driver');
const utils = require('./utils');

// generate the leaderboars
exports.generateLeaderBoards = function(session, data, camDrivers) {
  var boards = [];
  var lastTime = 0.0;

  session.forEach(function (value) {
    const currentTime = parseFloat(value.StartTime._text);
    const order = [];

    const cdoc = driver.currentDriverOnCamera(currentTime, lastTime, camDrivers);
    //console.log(cdoc);

    // TODO: retrieve fastest lap time and who did it!

    value.Drivers.Driver.forEach(function(current){
      const driverData = driver.getDriverByCarNumber(current.CarNumber._text, data.drivers);
      const d = {
        driver: driverData,
        isOnCamera: (driverData.number === cdoc),
        isFastestLap: false,
        fastestLap: 0, // TODO: populate fastest lap
        pit: current.PitStopCount._text,
        gap: 0 // TODO: populate gap
      };
      //console.log(d);
      order.push(d);
    });

    boards.push({
      start: currentTime,
      end: 0,
      lap: value.RacePosition._text,
      order: order
    });

    lastTime = currentTime;
  });

  // optimize remove duplicates and aggregate = less images to generate
  boards = optimizeLeaderBoards(boards);

  // set end value
  boards = setEndTime(boards);

  //console.log(boards);
  return boards;
};

// optimize removing duplicates
function optimizeLeaderBoards(boards) {
  var tmp = [];
  tmp.push(boards[0]);

  boards.forEach(function(b) {
      const prev = tmp[tmp.length-1];
      if(JSON.stringify(prev.order) !== JSON.stringify(b.order) || prev.lap !== b.lap) {
        tmp.push(b);
      }
  })
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