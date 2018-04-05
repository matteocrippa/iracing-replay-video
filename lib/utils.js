var fs = require('fs');
var path = require('path');

// clean up tmp directories
exports.cleanUpTmps = function() {
  console.log('🛀 Cleaning up tmp')
  var directory = path.resolve(__dirname, '../tmp/');
  fs.readdir(directory, function (err, files) {
    if (err) throw err;

    files.forEach(function (file) {
      if(file !== ".gitkeep") {
        fs.unlink(path.join(directory, file), function (err) {
          if (err) throw err;
        });
      }
    });
  });
};

function convert(secsTemp) {
  if ( secsTemp < 0 ) {
    return '';
  }
  decimals = 3;
  var secs = secsTemp % 60;
  var mins = Math.floor(secsTemp/60);
  var leadZero = false;
  if ( secs < 10 - 0.5 * Math.pow(10,-1*decimals) ) {
    leadZero = true;
  }
  return mins + ':' + (leadZero ? '0' : '') + secs.toFixed(decimals);
}

// input seconds to racing time
exports.convertTimeToRacing = function(secsTemp) {
  return convert(secsTemp);
};

// calculate gap
exports.calculateGap = function(first, current) {
  var curr = parseFloat(current);
  var gap = curr - first;
  if(first > -1) {
    var gapString = convert(gap);
    if(gapString) {
      return gapString;
    } else {
      return "";
    }
  } else {
    return "+0.000";
  }
};
