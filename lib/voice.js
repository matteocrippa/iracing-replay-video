const googleTTS = require('google-tts-api');
const download = require('download-file');

exports.generateAudio = function(text, file) {
  googleTTS(text, 'en', 1)   // speed normal = 1 (default), slow = 0.24
      .then(function (url) {
        console.log(url);
        download(url, {
          'directory': './tmp/',
          'filename': file
        }, function(err){
          if (err) throw err
          //console.log("downloaded")
        })
      })
      .catch(function (err) {
        console.error(err.stack);
      });
};