// require
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');

// clean up tmp directories
exports.prepareVideo = function(data) {

  const video = {
    intro: '../convert/intro.mp4',
    full: '../convert/video.mp4'
  };

  const image = {
    intro: '../tmp/intro.png',
    qualify: '../tmp/lb-qualify.png',
    race: '../tmp/lb-race.png'
  };

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
      .on('start', function(commandLine) {
        console.log('Spawned Ffmpeg with command: ' + commandLine);
      })
      .on('error', function(err) {
        console.log('An error occurred: ' + err.message);
      })
      .save(path.resolve(__dirname, '../tmp/intro.mp4'));

  ffmpeg()
      .input(path.resolve(__dirname, video.intro))
      .input(path.resolve(__dirname, image.race))
      .complexFilter([
        "[0:v] fade=type=in:duration=2:start_time=0 [faded]",
        "[faded][1:v] overlay=0:0:enable='between(t,1,15)' [final]",
        "[final] fade=type=out:duration=2:start_time=16 [output]"
      ], 'output')
      .on('start', function(commandLine) {
        console.log('Spawned Ffmpeg with command: ' + commandLine);
      })
      .on('error', function(err) {
        console.log('An error occurred: ' + err.message);
      })
      .save(path.resolve(__dirname, '../tmp/final.mp4'));

  const items = data.standings.length;
  const raceFilters = [];

  const race = ffmpeg();
  race
      .input(path.resolve(__dirname, video.full))
      .input(path.resolve(__dirname, '../tmp/lb-0.png'));

  raceFilters.push("[0:v]["+ (i+1) +":v] [combo0]");

  for(var i=0; i<data.standings.length; i++) {

    race.input(path.resolve(__dirname, '../tmp/lb-'+i+'.png'));

    const standing = data.standings[i];
    const prev = 'combo' + (i-1);
    var name = 'output';
    if (i < (items-1)) {
      name = 'combo' + i;
    }

    raceFilters.push("["+ prev +"]["+ (i+1) +":v] overlay=0:0:enable='between(t,"+ standing.start +","+ standing.end +")' ["+ name +"]");
  }

  race
      .complexFilter(raceFilters)
      .on('start', function(commandLine) {
        console.log('Spawned Ffmpeg with command: ' + commandLine);
      })
      .on('error', function(err) {
        console.log('An error occurred: ' + err.message);
      })
      .save(path.resolve(__dirname, '../tmp/race.mp4'));

};


// merge videos

