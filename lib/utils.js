const fs = require('fs');
const path = require('path');

// clean up tmp directories
exports.cleanUpTmps = function() {
  console.log('🛀 Cleaning up tmp')
  const directory = path.resolve(__dirname, '../tmp/');
  fs.readdir(directory, function (err, files) {
    if (err) throw err;

    files.forEach(function (file) {
      fs.unlink(path.join(directory, file), function (err) {
        if (err) throw err;
      });
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
  const curr = parseFloat(current);
  const gap = curr - first;
  if(first > -1) {
    const gapString = convert(gap);
    if(gapString) {
      return gapString;
    } else {
      return "";
    }
  } else {
    return "+0.000";
  }
};
