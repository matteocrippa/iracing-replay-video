// require
var ffmpeg = require('fluent-ffmpeg');
var path = require('path');
var async = require('async');
var getDuration = require('get-video-duration');
var utils = require('./utils');
var fs = require('fs');

// clean up tmp directories
exports.prepareVideo = function (data) {

  var duration = 0;

  var config = {
    skip: {
      music: false,
      slices: false,
      intro: false,
      end: false,
      race: false,
      commentary: true
    }
  };

  var video = {
    intro: '../input/intro.mp4',
    full: '../input/video.mp4'
  };

  var audio = {
    music: '../input/music.mp3',
    intro: '../tmp/intro.mp3',
    qualify: '../tmp/qualify.mp3',
    final: '../tmp/final.mp3'
  };

  var image = {
    intro: '../tmp/intro.png',
    qualify: '../tmp/lb-qualify.png',
    race: '../tmp/lb-race.png'
  };

  var chunks = utils.chunk(data.standings, 10);

  // array of task
  var tasks = [];

  // get full video info
  tasks.push(function (callback) {
    getDuration(path.resolve(__dirname, video.full)).then(function (d) {
      duration = d;
      callback();
    });
  });

  // check if intro video doesn't exists
  if(fs.existsSync(path.resolve(__dirname, video.intro)) === false) {
    tasks.push(function(callback){
      ffmpeg()
          .input(path.resolve(__dirname, video.full))
          .inputOptions(
              '-ss', '00:00:00',
              '-t', '00:00:18'
          )
          .audioCodec("copy")
          .videoCodec("copy")
          .outputOptions([
            "-async 1",
            "-preset ultrafast"
          ])
          .on('start', function (commandLine) {
            console.log('🎥 - Create missing Intro video');
            //console.log(commandLine);
          })
          .on('end', function () {
            callback();
          })
          .on('error', function (err) {
            console.log('An error occurred: ' + err.message);
            callback(err.message);
          })
          .save(path.resolve(__dirname, video.intro));
    });
  }

  // create intro video
  if(config.skip.intro === false) {
    tasks.push(function (callback) {
      var editor = ffmpeg()
          .input(path.resolve(__dirname, video.intro))
          .input(path.resolve(__dirname, image.intro))

      // calculate how many slices we have
      var chunks = utils.chunk(data.drivers, 14);
      var index = 0;

      var filters = [
        "[0:v] fade=type=in:duration=2:start_time=0 [faded]",
        "[faded][1:v] overlay=0:0:enable='between(t,1,8)' [intro]"
      ];

      var lastname = 'intro';
      var imagestart = 9;
      var length = (9/chunks.length);

      chunks.forEach(function(chunk) {
        // load images
        editor.input(path.resolve(__dirname, '../tmp/lb-qualify-'+index+'.png'));

        // add overlay
        filters.push("["+lastname+"]["+(index+2)+":v] overlay=0:0:enable='between(t,"+imagestart+","+(imagestart+length)+")' [edit"+index+"]");

        // store last name
        lastname = "[edit"+index+"]";

        // update image start
        imagestart = imagestart + length;
      });

      filters.push("["+lastname+"] fade=type=out:duration=2:start_time=16 [output]");

      editor.audioCodec("copy");


      editor.complexFilter(filters)
          .outputOptions([
            "-map 0:a?",
            "-map [output]",
            "-threads 0",
            "-preset ultrafast"
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
    });

  }

  // audio for intro
  if(config.skip.music === false){
    tasks.push(function (callback) {
      ffmpeg()
          .input(path.resolve(__dirname, '../tmp/intro.mp4'))
          .input(path.resolve(__dirname, audio.music))
          .complexFilter([
            "[1:a]volume=0.3:precision=fixed[a1]",
            "[0:a][a1]amerge=inputs=2[a]"
          ])
          .outputOptions([
            "-map 0:v",
            "-map [a]",
            "-c:v copy",
            "-ac 2",
            "-shortest",
            "-preset ultrafast"
          ])
          .save(path.resolve(__dirname, '../tmp/intro.mp4'))
    });
  }


  // ending video
  if(config.skip.end === false) {
    tasks.push(function (callback) {

      var editor = ffmpeg()
          .input(path.resolve(__dirname, video.intro))
          .input(path.resolve(__dirname, image.intro))

      // calculate how many slices we have
      var chunks = utils.chunk(data.drivers, 14);
      var index = 0;

      var filters = [
        "[0:v] fade=type=in:duration=2:start_time=0 [faded]"
      ];

      var lastname = 'faded';
      var imagestart = 2;
      var length = (16/chunks.length);

      chunks.forEach(function(chunk) {
        // load images
        editor.input(path.resolve(__dirname, '../tmp/lb-race-'+index+'.png'));

        // add overlay
        filters.push("["+lastname+"]["+(index+2)+":v] overlay=0:0:enable='between(t,"+imagestart+","+(imagestart+length)+")' [edit"+index+"]");

        // store last name
        lastname = "[edit"+index+"]";

        // update image start
        imagestart = imagestart + length;
      });

      editor.audioCodec("copy");


      editor
          .complexFilter(filters)
          .outputOptions([
            "-map 0:a?",
            "-map ["+lastname+"]",
            "-threads 0",
            "-preset ultrafast"
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
          .save(path.resolve(__dirname, '../tmp/end.mp4'))
    });
  }

  // audio for intro
  if(config.skip.music === false){
    tasks.push(function (callback) {
      ffmpeg()
          .input(path.resolve(__dirname, '../tmp/end.mp4'))
          .input(path.resolve(__dirname, audio.music))
          .complexFilter([
            "[1:a]volume=0.3:precision=fixed[a1]",
            "[0:a][a1]amerge=inputs=2[a]"
          ])
          .outputOptions([
            "-map 0:v",
            "-map [a]",
            "-c:v copy",
            "-ac 2",
            "-shortest",
            "-preset ultrafast"
          ])
          .save(path.resolve(__dirname, '../tmp/end.mp4'))
    });
  }

  var isFirst = true;
  var previous = null;
  var id = 0;

  // slice race videos
  if (config.skip.slices === false) {
    chunks.forEach(function (c) {
      tasks.push(function (callback) {
        // generate the video content
        sliceVideo(callback, c, previous, video, id, chunks.length, duration);

        // turn false asap
        isFirst = false;
        previous = c[c.length - 1].end;
        id += 1;
      });
    });
  }

  var idd = 0;
  var previousr = 0;
  if(config.skip.race === false) {
    // push race videos
    chunks.forEach(function (c) {
      tasks.push(function (callback) {
        // generate the video content
        generateRaceVideo(callback, c, video, previousr, idd);

        // turn false asap
        idd += 1;
        previousr = c[c.length - 1].end;
      });
    });
  }


  // final
  tasks.push(function (callback) {
    var final = ffmpeg()
        .input(path.resolve(__dirname, '../tmp/intro.mp4'))

    for (var i = 0; i < chunks.length; i++) {
      final.input(path.resolve(__dirname, '../tmp/race-f-' + i + '.mp4'));
    }

    final.input(path.resolve(__dirname, '../tmp/end.mp4'))
        .outputOptions([
          "-threads 0",
          "-preset ultrafast"
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
  });

  // add audio?
  if(config.skip.commentary === false) {
    task.push(function(callback){
      // ffmpeg -y -i a.mp4 -itsoffset 00:00:30 sng.m4a -map 0:0 -map 1:0 -c:v copy -preset ultrafast -async 1 out.mp4
    });
  }

  async.waterfall(tasks,
      function (err, result) {
        if (err) return console.log('❌' + err);
        console.log('✅ - Movie created!!');
      });
};


// slice video
function sliceVideo(callback, data, previousEnd, video, id, items, duration) {
  var slicer = ffmpeg();

  var start = (id === 0) ? 0 : previousEnd;
  var end = (id < items - 1) ? data[data.length - 1].end : duration;

  slicer
      .input(path.resolve(__dirname, video.full))
      .audioCodec("copy")
      .videoCodec("copy")
      .seekInput(start)
      .duration(end - start)
      .on('start', function (commandLine) {
        console.log('✂️ - Slicing racing video '+id);
        //console.log(commandLine);
      })
      .on('end', function () {
        callback();
      })
      .on('error', function (err) {
        console.log('An error occurred: ' + err.message);
        callback(err.message);
      })
      .save(path.resolve(__dirname, '../tmp/race-' + id + '.mp4'));

}

// create race video
function generateRaceVideo(callback, data, video, previousEnd, id) {
  var race = ffmpeg();
  var raceFilters = [];
  var lastName = '';

  var input = '../tmp/race-' + id + '.mp4';
  var output = '../tmp/race-f-' + id + '.mp4'

  // get the file to process
  race
      .input(path.resolve(__dirname, input));

  var i = 0;
  data.forEach(function (chunk) {

    // structure data
    var start = chunk.start - previousEnd;
    var end = ((chunk.end === 0) ? chunk.start : chunk.end) - previousEnd;

    var videoName = "[" + (i + 1) + ":v]";
    var prevName = (i === 0) ? "[0:v]" : "[combo" + (i - 1) + "]";
    var nextName = "[combo" + i + "]";

    // add image input
    race.input(path.resolve(__dirname, chunk.filename));

    // add filter
    raceFilters.push(prevName + videoName + " overlay=0:0:enable='between(t," + start + "," + end + ")' " + nextName);

    // tmp and increment
    lastName = nextName;
    i += 1;
  });

  race
      .audioCodec("copy")
      .complexFilter(raceFilters)
      .outputOptions([
        "-map 0:a?",
        "-map " + lastName,
        "-threads 0",
        "-preset ultrafast"
      ])
      .on('start', function (commandLine) {
        console.log('🚗 - Race video '+id);
        //console.log(commandLine);
      })
      .on('end', function () {
        callback();
      })
      .on('error', function (err) {
        console.log('An error occurred: ' + err.message);
        callback(err.message);
      })
      .save(path.resolve(__dirname, output));
}