// require
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const async = require("async");
const getDuration = require('get-video-duration');

// clean up tmp directories
exports.prepareVideo = function (data) {

  var duration = 0;

  const config = {
    skip: {
      slices: false,
      intro: false,
      end: false,
      race: false
    }
  };

  const video = {
    intro: '../input/intro.mp4',
    full: '../input/video.mp4'
  };

  const audio = {
    intro: '../tmp/intro.mp3',
    qualify: '../tmp/qualify.mp3',
    final: '../tmp/final.mp3'
  };

  const image = {
    intro: '../tmp/intro.png',
    qualify: '../tmp/lb-qualify.png',
    race: '../tmp/lb-race.png'
  };

  const chunks = chunk(data.standings, 10);

  // array of task
  const tasks = [];

  // get full video info
  tasks.push(function (callback) {
    getDuration(path.resolve(__dirname, video.full)).then(function (d) {
      duration = d;
      callback();
    });
  });

  // create intro video
  if(config.skip.intro === false) {
    tasks.push(function (callback) {
      ffmpeg()
          .input(path.resolve(__dirname, video.intro))
          .input(path.resolve(__dirname, image.intro))
          .input(path.resolve(__dirname, image.qualify))
          .input(path.resolve(__dirname, audio.intro))
          .input(path.resolve(__dirname, audio.qualify))
          .audioCodec("copy")
          .complexFilter([
            "[0:v] fade=type=in:duration=2:start_time=0 [faded]",
            "[faded][1:v] overlay=0:0:enable='between(t,1,8)' [intro]",
            "[intro][2:v] overlay=0:0:enable='between(t,9,16)' [qualify]",
            "[qualify] fade=type=out:duration=2:start_time=16 [end]",
            /*"[3:a] adelay=2 [audio1]",
            "[4:a] adelay=10 [audio2]",
            "[end][audio1] amix [aout]",
            "[aout][audio2] amix [output]"*/
          ])
          .outputOptions([
            "-map 0:a?",
            "-map [end]",
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


  // ending video
  if(config.skip.end === false) {
    tasks.push(function (callback) {
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

  async.waterfall(tasks,
      function (err, result) {
        if (err) return console.log('❌' + err);
        console.log('✅ - Movie created!!');
      });
};


// slice video
function sliceVideo(callback, data, previousEnd, video, id, items, duration) {
  const slicer = ffmpeg();

  const start = (id === 0) ? 0 : previousEnd;
  const end = (id < items - 1) ? data[data.length - 1].end : duration;

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
  const race = ffmpeg();
  const raceFilters = [];
  var lastName = '';

  const input = '../tmp/race-' + id + '.mp4';
  const output = '../tmp/race-f-' + id + '.mp4'

  // get the file to process
  race
      .input(path.resolve(__dirname, input));

  var i = 0;
  data.forEach(function (chunk) {

    // structure data
    const start = chunk.start - previousEnd;
    const end = ((chunk.end === 0) ? chunk.start : chunk.end) - previousEnd;

    const videoName = "[" + (i + 1) + ":v]";
    const prevName = (i === 0) ? "[0:v]" : "[combo" + (i - 1) + "]";
    const nextName = "[combo" + i + "]";

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

// split an array in sub-array of N elements each
function chunk(arr, n) {
  return arr.reduce(function (p, cur, i) {
    (p[i / n | 0] = p[i / n | 0] || []).push(cur);
    return p;
  }, []);
}