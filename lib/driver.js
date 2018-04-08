var _ = require('underscore');

// generate list of drivers
exports.generateDriverList = function(session) {
  var drivers = [];
  session.DriverInfo.Drivers._Drivers.forEach(function(driver){

    var driverSurname = "";

    _.rest(driver.UserName._text.split(" ")).forEach(function(item){
      driverSurname += item.replace(/[0-9]/g, '') + " "
    });

    drivers.push({
      fullname: driver.UserName._text.replace(/[0-9]/g, ''),
      surname: driverSurname,
      initial: driver.Initials ? driver.Initials._text : '',
      number: driver.CarNumber._text,
      userid: driver.UserID._text,
      idx: driver.CarIdx._text,
      car: driver.CarScreenName._text,
      color: driver.CarDesignStr._text.split(",")[1],
      license: {
        color: driver.LicColor._text.replace("0x", "#"),
        rating: driver.LicString._text
      },
      nationality: '' // TODO: this would be nice for flags
    });
  });

  //console.log(drivers);
  return drivers;
};

// get driver data by car id
exports.getDriverByCarNumber = function(number, drivers) {
  return drivers.filter(function(d) {
    return d.number === number
  })[0];
};

// get driver data by driver idx
exports.getDriverById = function(id, drivers) {
  return drivers.filter(function(d) {
    return d.idx === id
  })[0];
};

// retrieve current driver on camera
exports.currentDriverOnCamera = function(current, last, data) {
  var c = parseFloat(current);
  var l = parseFloat(last);
  var driver = 0;

  data.CamDriver.every(function(camera, index){
    var t = parseFloat(camera.StartTime._text);
    if(t> l && t <c) {
      driver = camera.CurrentDriver.CarNumber._text;
      return false;
    }
    return true;
  });

  return driver;
};