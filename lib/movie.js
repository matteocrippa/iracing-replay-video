// require
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const async = require("async");
const fs = require('fs');

// clean up tmp directories
exports.prepareVideo = function(data) {


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
    function(callback) {
      ffmpeg()
          .input(path.resolve(__dirname, video.intro))
          .input(path.resolve(__dirname, image.intro))
          .input(path.resolve(__dirname, image.qualify))
          .complexFilter([
            "[0:v] fade=type=in:duration=2:start_time=0 [faded]",
            "[faded][1:v] overlay=0:0:enable='between(t,1,8)' [intro]",
            "[intro][2:v] overlay=0:0:enable='between(t,9,16)' [qualify]",
            "[qualify] fade=type=out:duration=2:start_time=16 [output]"
          ], 'output')
          .on('start', function (commandLine) {
            console.log('Spawned Ffmpeg with command: ' + commandLine);
          })
          .on('end', function () {
            callback();
          })
          .on('error', function (err) {
            console.log('An error occurred: ' + err.message);
            callback();
          })
          .save(path.resolve(__dirname, '../tmp/intro.mp4'));
    },
    function(callback) {
      ffmpeg()
          .input(path.resolve(__dirname, video.intro))
          .input(path.resolve(__dirname, image.race))
          .complexFilter([
            "[0:v] fade=type=in:duration=2:start_time=0 [faded]",
            "[faded][1:v] overlay=0:0:enable='between(t,1,15)' [final]",
            "[final] fade=type=out:duration=2:start_time=16 [output]"
          ], 'output')
          .on('start', function (commandLine) {
            console.log('Spawned Ffmpeg with command: ' + commandLine);
          })
          .on('end', function () {
            callback();
          })
          .on('error', function (err) {
            console.log('An error occurred: ' + err.message);
            callback();
          })
          .save(path.resolve(__dirname, '../tmp/end.mp4'));
    },
      function(callback) {

    // TODO: need to split in mini slices

        const items = data.standings.length;
        const raceFilters = [];

        const race = ffmpeg();
        race
            .input(path.resolve(__dirname, video.full))
            .input(path.resolve(__dirname, '../tmp/lb-0.png'));

        raceFilters.push("[0:v][" + (i + 1) + ":v] [combo0]");

        var last = '';

        for (var i = 0; i < data.standings.length; i++) {

          race.input(path.resolve(__dirname, '../tmp/lb-' + i + '.png'));

          const standing = data.standings[i];
          const prev = 'combo' + (i - 1);
          var name = 'output';
          if (i < (items - 1)) {
            name = 'combo' + i;
          }

          const start = standing.start;
          var end = standing.end;

          if (end < start) {
            end = start;
          }

          raceFilters.push("[" + prev + "][" + (i + 1) + ":v] overlay=0:0:enable='between(t," + start + "," + end + ")' [" + name + "]");
          last = name;
        }

        race
            .complexFilter(raceFilters, last)
            .on('start', function (commandLine) {
              console.log('Spawned Ffmpeg with command: ' + commandLine);
            })
            .on('end', function () {
              callback();
            })
            .on('error', function (err) {
              console.log('An error occurred: ' + err.message);
              callback();
            })
            .save(path.resolve(__dirname, '../tmp/race.mp4'));
      },
      function (callback) {
        ffmpeg()
            .input(path.resolve(__dirname, '../tmp/intro.mp4'))
            .input(path.resolve(__dirname, '../tmp/race.mp4'))
            .input(path.resolve(__dirname, '../tmp/end.mp4'))
            .on('start', function (commandLine) {
              console.log('Spawned Ffmpeg with command: ' + commandLine);
            })
            .on('end', function () {
              callback();
            })
            .on('error', function (err) {
              console.log('An error occurred: ' + err.message);
              callback();
            })
            .mergeToFile(path.resolve(__dirname, '../output/final.mp4'), path.resolve(__dirname, '../tmp'));
      }
  ], function (err, result) {
    if(err) return console.log('❌' + err);
    console.log('✅ - Movie created!!');
  });
};




