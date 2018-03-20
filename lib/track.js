// generates track info
exports.generateTrackData = function(session) {
  const track = {};
  track.name = session.WeekendInfo.TrackDisplayName._text;
  track.length = session.WeekendInfo.TrackLength._text;
  track.city = session.WeekendInfo.TrackCity._text;
  track.country = session.WeekendInfo.TrackCountry._text;
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
