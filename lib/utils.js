// clean up tmp directories
exports.cleanUpTmps = function() {
  console.log('TODO: remove ./tmp/*.png');
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

// convert seconds to racing time
exports.convertTimeToRacing = function(secsTemp) {
  return convert(secsTemp);
};

// calculate gap
exports.calculateGap = function(first, current) {
  const curr = parseFloat(current);
  const gap = curr - first;
  if(first > -1) {
    return "+" + convert(gap);
  } else {
    return "+0.000";
  }
};
