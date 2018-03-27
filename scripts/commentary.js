const googleTTS = require('google-tts-api');

googleTTS('Welcome today to Okayama circuit, in Japan, for Mazda MX-5 race', 'en', 1)   // speed normal = 1 (default), slow = 0.24
    .then(function (url) {
      console.log(url); // https://translate.google.com/translate_tts?...
    })
    .catch(function (err) {
      console.error(err.stack);
    });


/*
var download = require('download-file')

var url = "http://i.imgur.com/G9bDaPH.jpg"

var options = {
    directory: "./images/cats/",
    filename: "cat.gif"
}

download(url, options, function(err){
    if (err) throw err
    console.log("meow")
}) 
 */