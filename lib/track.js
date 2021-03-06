var countries = require('country-list')();

// generates track info
exports.generateTrackData = function(session) {
  var track = {};
  track.name = session.WeekendInfo.TrackDisplayName._text;
  track.length = session.WeekendInfo.TrackLength._text;
  track.city = session.WeekendInfo.TrackCity._text;
  track.country = {};
  track.country.full = session.WeekendInfo.TrackCountry._text;
  var country = session.WeekendInfo.TrackCountry._text;
  // patch USA to United States
  if (country === 'USA') {
    country = 'United States';
  }
  track.country.iso = countries.getCode(country).toLowerCase();
  track.weather = {};
  track.weather.temperature = {}
  track.weather.temperature.air = session.WeekendInfo.TrackAirTemp._text;
  track.weather.temperature.track = session.WeekendInfo.TrackSurfaceTemp._text;
  track.weather.wind = {};
  track.weather.wind.speed = session.WeekendInfo.TrackWindVel._text;
  track.weather.wind.direction = session.WeekendInfo.TrackWindDir._text;

  //console.log(track);
  return track;
};
