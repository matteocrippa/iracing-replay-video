var ejs = require('ejs');
var webshot = require('webshot');
var fs = require('fs');
var path = require('path');
var utils = require('./utils');

// converts html to png image
function html2png(html, filename, finished) {
  webshot(html, path.resolve(__dirname, filename), {
    siteType: 'html',
      screenSize: {
        width: 1920,
        height: 1080
      }
    }, function(err) {
    if(err) {
      console.log(err);
    }
    console.log('>> 🗂 - Writing ' + filename);
    finished();
  });
}

exports.generateIntroImage = function(data) {
  ejs.renderFile('./templates/intro.ejs', { data: data }, {}, function(err, str){
     html2png(str, '../tmp/intro.png', function() {});
  });
}

function prepareLeaderBoard(data, current) {
  var template = fs.readFileSync('./templates/leaderboard-small.ejs', 'utf-8');
  var standings = data.standings[current];
  var html = ejs.render(template, { standings: standings, track: data.track });
  if (html) {
    html2png(html, standings.filename, function() {
      current += 1;
      if(current < data.standings.length) {
        prepareLeaderBoard(data, current);
      }
    });
  }
}

exports.generateLeaderboardImages = function(data) {
  var current = 0;
  prepareLeaderBoard(data, current);
};

exports.generateEndSessionImage = function(data, isQualify) {
  var template = './templates/race.ejs';
  var standings = data.race;
  if (isQualify) {
    template = './templates/qualify.ejs';
    standings = data.qualify;
  }

  var chunks = utils.chunk(standings, 15);
  var index = 0;

  chunks.forEach(function(chunk) {
    ejs.renderFile(template, { standings: chunk, track: data.track, data: data, startAt: 14*index }, {}, function(err, html){
      if(html) {
        var filename = '../tmp/lb-qualify-'+index+'.png';
        if(isQualify === false) {
          filename = '../tmp/lb-race-'+index+'.png';
        }
        html2png(html, filename, function() {});
        index += 1;
      } else {
        console.log(err);
      }
    });
  });

};