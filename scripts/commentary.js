// require
var voice = require('../lib/voice');
var fs = require('fs');
var path = require('path');

// retrieve json data
var data = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../tmp/data.json'), 'utf8'));

// prepare comments
console.log('👨‍🎤 preparing voices');

// voices
var commentary = {
  intro: {
    file: 'intro.mp3',
    text: "Welcome to "+ data.track.name +" in "+ data.track.city +", "+ data.track.country.full +". For an exiciting race"
  },
  qualify: {
    file: 'qualify.mp3',
    text: "Here a quick view of the qualify standings"
  },
  final: {
    file: 'final.mp3',
    text: "It was a nice race today at "+ data.track.name +", we hope you enjoyed that too!"
  }
}

// generate intro
voice.generateAudio(commentary.intro.text, commentary.intro.file);

// generate qualify
voice.generateAudio(commentary.qualify.text, commentary.qualify.file);

// generate final
voice.generateAudio(commentary.final.text, commentary.final.file);

// generate all other
data.commentary.forEach(function(comment){
  voice.generateAudio(comment.text, comment.file);
});