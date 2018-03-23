// require
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const async = require("async");

// clean up tmp directories
exports.prepareVideo = function (data) {


  const video = {
    intro: '../input/intro.mp4',
    full: '../input/video.mp4'
  };

  const image = {
    intro: '../tmp/intro.png',
    qualify: '../tmp/lb-qualify.png',
    race: '../tmp/lb-race.png'
  };

  async.waterfall([
    function (callback) {
      ffmpeg()
          .input(path.resolve(__dirname, video.intro))
          .input(path.resolve(__dirname, image.intro))
          .input(path.resolve(__dirname, image.qualify))
          .audioCodec("copy")
          .complexFilter([
            "[0:v] fade=type=in:duration=2:start_time=0 [faded]",
            "[faded][1:v] overlay=0:0:enable='between(t,1,8)' [intro]",
            "[intro][2:v] overlay=0:0:enable='between(t,9,16)' [qualify]",
            "[qualify] fade=type=out:duration=2:start_time=16 [output]",
          ])
          .outputOptions([
            "-map 0:a?",
            "-map [output]",
            "-threads 0"
          ])
          .on('start', function (commandLine) {
            console.log('🎥 - Intro video');
            //console.log(commandLine);
          })
          .on('end', function () {
            callback();
          })
          .on('error', function (err) {
            console.log('An error occurred: ' + err.message);
            callback(err.message);
          })
          .save(path.resolve(__dirname, '../tmp/intro.mp4'));
    },
    function (callback) {
      ffmpeg()
          .input(path.resolve(__dirname, video.intro))
          .input(path.resolve(__dirname, image.race))
          .audioCodec("copy")
          .complexFilter([
            "[0:v] fade=type=in:duration=2:start_time=0 [faded]",
            "[faded][1:v] overlay=0:0:enable='between(t,1,15)' [final]",
            "[final] fade=type=out:duration=2:start_time=16 [output]"
          ])
          .outputOptions([
            "-map 0:a?",
            "-map [output]",
            "-threads 0"
          ])
          .on('start', function (commandLine) {
            console.log('🎥 - Race results video');
            //console.log(commandLine);
          })
          .on('end', function () {
            callback();
          })
          .on('error', function (err) {
            console.log('An error occurred: ' + err.message);
            callback(err.message);
          })
          .save(path.resolve(__dirname, '../tmp/end.mp4'));
    },
    function (callback) {
      generateRaceVideo(callback, data, video, [0, data.standings.length / 4]);
    },
    function (callback) {
      generateRaceVideo(callback, data, video, [(data.standings.length / 4)+1, ((data.standings.length / 4)*2)]);
    },
    function (callback) {
      generateRaceVideo(callback, data, video, [(data.standings.length / 4)+2, ((data.standings.length / 4)*3)]);
    },
    function (callback) {
      generateRaceVideo(callback, data, video, [((data.standings.length / 4)*3)+1, data.standings.length]);
    },
    function (callback) {
      ffmpeg()
          .input(path.resolve(__dirname, '../tmp/intro.mp4'))
          .input(path.resolve(__dirname, '../tmp/race.mp4'))
          .input(path.resolve(__dirname, '../tmp/end.mp4'))
          .audioCodec("copy")
          .videoCodec("copy")
          .outputOptions([
            "-threads 0"
          ])
          .on('start', function (commandLine) {
            console.log('🎥 - Full video');
            //console.log(commandLine);
          })
          .on('end', function () {
            callback();
          })
          .on('error', function (err) {
            console.log('An error occurred: ' + err.message);
            callback(err.message);
          })
          .mergeToFile(path.resolve(__dirname, '../output/final.mp4'), path.resolve(__dirname, '../tmp'));
    }
  ], function (err, result) {
    if (err) return console.log('❌' + err);
    console.log('✅ - Movie created!!');
  });
};


function generateRaceVideo(callback, data, video, bounds) {
  const race = ffmpeg();
  const raceFilters = [];
  var lastName = '';

  // get the file to process, at first round use the video
  if(bounds[0] === 0) {
    race.input(path.resolve(__dirname, video.full));
  } else {
    // then use the tmp one
    race.input(path.resolve(__dirname, '../tmp/race.mp4'));
  }

  console.log(bounds);

  for (var i = bounds[0]; i < bounds[1]; i++) {
    // add input
    race.input(path.resolve(__dirname, '../tmp/lb-' + i + '.png'));

    // prepare data
    const standing = data.standings[i];
    const start = standing.start;
    const end = (standing.end === 0) ? standing.start : standing.end;

    const videoName = "[" + (i + 1) + ":v]";
    const prevName = (i === 0) ? "[0:v]" : "[combo" + (i - 1) + "]";
    const nextName = "[combo" + i + "]";

    raceFilters.push(prevName + videoName + " overlay=0:0:enable='between(t," + start + "," + end + ")' " + nextName);

    lastName = nextName;
  }

  race
      .audioCodec("copy")
      .complexFilter(raceFilters)
      .outputOptions([
        "-map 0:a?",
        "-map " + lastName,
        "-threads 0",
      ])
      .on('start', function (commandLine) {
        console.log('🎥 - Race video');
        //console.log(commandLine);
      })
      .on('end', function () {
        callback();
      })
      .on('error', function (err) {
        console.log('An error occurred: ' + err.message);
        callback(err.message);
      })
      .save(path.resolve(__dirname, '../tmp/race.mp4'));
}


