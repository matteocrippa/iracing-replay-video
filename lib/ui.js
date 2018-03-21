const ejs = require('ejs');
const webshot = require('webshot');
const fs = require('fs');

// converts html to png image
function html2png(html, path, finished) {
  webshot(html, path, {
    siteType: 'html',
      screenSize: {
        width: 1920,
        height: 1080
      }
    }, function(err) {
    if(err) {
      console.log(err);
    }
    console.log('>> 🗂 - Writing ' + path);
    finished();
  });
}

exports.generateIntroImage = function(data) {
  ejs.renderFile('./templates/intro.ejs', { data: data }, {}, function(err, str){
     html2png(str, './tmp/intro.png', function() {});
  });
}

function prepareLeaderBoard(data, current) {
  const template = fs.readFileSync('./templates/leaderboard-small.ejs', 'utf-8');
  const standings = data.standings[current];
  const html = ejs.render(template, { standings: standings, track: data.track });
  if (html) {
    const filename = './tmp/lb-' + current + '.png';
    html2png(html, filename, function() {
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
  ejs.renderFile(template, { standings: standings, track: data.track }, {}, function(err, html){
    if(html) {
      var filename = './tmp/lb-qualify.png';
      if(isQualify === false) {
        filename = './tmp/lb-race.png';
      }
      html2png(html, filename, function() {});
    } else {
      console.log(err);
    }
  });
};