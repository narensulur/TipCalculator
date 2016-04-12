var dateFormat = function () {
  var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
    timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
    timezoneClip = /[^-+\dA-Z]/g,
    pad = function (val, len) {
      val = String(val);
      len = len || 2;
      while (val.length < len) val = "0" + val;
      return val;
    };

  // Regexes and supporting functions are cached through closure
  return function (date, mask, options) { //utc, forceEnglish
    if (!options) {
      options = {};
    }
    
    var dF = dateFormat;
    var i18n = options.forceEnglish ? dF.i18nEnglish : dF.i18n;

    // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
    if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
      mask = date;
      date = undefined;
    }

    // Passing date through Date applies Date.parse, if necessary
    date = date ? new Date(date) : new Date;
    if (isNaN(date)) throw SyntaxError("invalid date");

    mask = String(dF.masks[mask] || mask || dF.masks["default"]);

    // Allow setting the utc argument via the mask
    if (mask.slice(0, 4) == "UTC:") {
      mask = mask.slice(4);
      options.utc = true;
    }

    var _ = options.utc ? "getUTC" : "get",
      d = date[_ + "Date"](),
      D = date[_ + "Day"](),
      m = date[_ + "Month"](),
      y = date[_ + "FullYear"](),
      H = date[_ + "Hours"](),
      M = date[_ + "Minutes"](),
      s = date[_ + "Seconds"](),
      L = date[_ + "Milliseconds"](),
      o = options.utc ? 0 : date.getTimezoneOffset(),
      flags = {
        d:    d,
        dd:   pad(d),
        ddd:  i18n.dayNamesShort[D],
        dddd: i18n.dayNames[D],
        m:    m + 1,
        mm:   pad(m + 1),
        mmm:  i18n.monthNamesShort[m],
        mmmm: i18n.monthNames[m],
        yy:   String(y).slice(2),
        yyyy: y,
        h:    H % 12 || 12,
        hh:   pad(H % 12 || 12),
        H:    H,
        HH:   pad(H),
        M:    M,
        MM:   pad(M),
        s:    s,
        ss:   pad(s),
        l:    pad(L, 3),
        L:    pad(L > 99 ? Math.round(L / 10) : L),
        t:    H < 12 ? "a"  : "p",
        tt:   H < 12 ? "am" : "pm",
        T:    H < 12 ? "A"  : "P",
        TT:   H < 12 ? "AM" : "PM",
        Z:    options.utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
        o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
        S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
      };

    var ret = mask.replace(token, function ($0) {
      return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
    });

    if (options.noZeros) {
      ret = ret.replace(":00", "");
    }
    
    return ret;
  };
}();

// Some common format strings
dateFormat.masks = {
  "default":      "ddd mmm dd yyyy HH:MM:ss",
  shortDate:      "m/d/yy",
  mediumDate:     "mmm d, yyyy",
  longDate:       "mmmm d, yyyy",
  fullDate:       "dddd, mmmm d, yyyy",
  shortTime:      "h:MM TT",
  mediumTime:     "h:MM:ss TT",
  longTime:       "h:MM:ss TT Z",
  isoDate:        "yyyy-mm-dd",
  isoTime:        "HH:MM:ss",
  isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
  isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
  dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
};

dateFormat.i18nEnglish = $.extend(true, {}, dateFormat.i18n);
dateFormat.i18nCalendarLanguage = $.extend(true, {}, dateFormat.i18n);

Date.prototype.addSeconds = function(seconds, cloneDate) {
  var date;
  if (cloneDate) {
    date = new Date(this);    
  } else {
    date = this;
  }
  date.setSeconds(date.getSeconds() + seconds, date.getMilliseconds());
  return date;
}

Date.prototype.subtractSeconds = function(seconds, cloneDate) {
  return this.addSeconds(-seconds, cloneDate);
}

Date.prototype.addDays = function(days) {
  var newDate = new Date(this);
  newDate.setDate(newDate.getDate()+days);
  return newDate;
}

Date.prototype.subtractDays = function(days) {
  return this.addDays(days*-1);
}

// For convenience...
Date.prototype.format = function (mask, options) {
  return dateFormat(this, mask, options);
};

Date.prototype.formatTime = function(removeTrailingZeroes) {
  if (bg.localStorage["24hourMode"] == "true") {
    return pad(this.getHours(), 2, '0') + ":" + pad(this.getMinutes(), 2, '0');
  } else {
    var time = "";
    if (this.getHours() >= 12) {
      if (this.getHours() == 12) {
        time = 12;
      } else {
        time = this.getHours() - 12;
      }
      time = time + ":" + pad(this.getMinutes(), 2, '0') + "pm";
    } else if (this.getHours() == 0) {
      time = "12:" + pad(this.getMinutes(), 2, '0') + "am";
    } else {
      time = this.getHours() + ":" + pad(this.getMinutes(), 2, '0') + "am";
    }
    if (removeTrailingZeroes) {
      time = time.replace(":00", "");
    }
    return time;
  }
}

Date.prototype.clearTime = function () {
  this.setHours(0);
  this.setMinutes(0);
  this.setSeconds(0); 
  this.setMilliseconds(0);
}

Date.prototype.toRFC3339 = function() {
  //var gmtHours = -d.getTimezoneOffset()/60;
  return this.getUTCFullYear() + "-" + pad(this.getUTCMonth()+1, 2, '0') + "-" + pad(this.getUTCDate(), 2, '0') + "T" + pad(this.getUTCHours(), 2, '0') + ":" + pad(this.getUTCMinutes(), 2, '0') + ":00Z";
}

function now() {
  return new Date().getTime();
}

function today() {
  var offsetToday = null;
  if (offsetToday) {
    return new Date(offsetToday);
  } else {
    return new Date();
  }
}

function yesterday() {
  var yest = new Date();
  yest.setDate(yest.getDate()-1);
  return yest;
}

function tomorrow() {
  var tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate()+1);
  return tomorrow;
}

function isToday(date) {
  return date.getFullYear() == new Date().getFullYear() && date.getMonth() == new Date().getMonth() && date.getDate() == new Date().getDate();
}

function isTomorrow(date) {
  var tom = tomorrow();
  return date.getFullYear() == tom.getFullYear() && date.getMonth() == tom.getMonth() && date.getDate() == tom.getDate();
}

function isYesterday(date) {
  var yest = yesterday();
  return date.getFullYear() == yest.getFullYear() && date.getMonth() == yest.getMonth() && date.getDate() == yest.getDate();
}

Date.prototype.isToday = function () {
  return isToday(this);
};

Date.prototype.isTomorrow = function () {
  return isTomorrow(this);
};

Date.prototype.isYesterday = function () {
  return isYesterday(this);
};

Date.prototype.isSameDay = function (otherDay) {
  return this.getFullYear() == otherDay.getFullYear() && this.getMonth() == otherDay.getMonth() && this.getDate() == otherDay.getDate();
};

Date.prototype.isBefore = function(otherDate) {
  var paramDate;
  if (otherDate) {
    paramDate = new Date(otherDate);
  } else {
    paramDate = new Date();
  } 
  var thisDate = new Date(this);
  return thisDate.getTime() < paramDate.getTime();
};

Date.prototype.isEqual = function(otherDate) {
  return this.getTime() == otherDate.getTime();
};

Date.prototype.isEqualOrBefore = function(otherDate) {
  return this.isBefore(otherDate) || (otherDate && this.getTime() == otherDate.getTime());
};

Date.prototype.isAfter = function(otherDate) {
  return !this.isEqualOrBefore(otherDate);
};

Date.prototype.isEqualOrAfter = function(otherDate) {
  return !this.isBefore(otherDate);
};

Date.prototype.diffInSeconds = function(otherDate) {
  var d1;
  if (otherDate) {
    d1 = new Date(otherDate);
  } else {
    d1 = new Date();
  } 
  var d2 = new Date(this);
  return Math.round(Math.ceil(d2.getTime() - d1.getTime()) / ONE_SECOND);
};

Date.prototype.diffInMinutes = function(otherDate) {
  var d1;
  if (otherDate) {
    d1 = new Date(otherDate);
  } else {
    d1 = new Date();
  } 
  var d2 = new Date(this);
  return Math.round(Math.ceil(d2.getTime() - d1.getTime()) / ONE_MINUTE);
};

Date.prototype.diffInHours = function(otherDate) {
  var d1;
  if (otherDate) {
    d1 = new Date(otherDate);
  } else {
    d1 = new Date();
  } 
  var d2 = new Date(this);
  return Math.round(Math.ceil(d2.getTime() - d1.getTime()) / ONE_HOUR);
};

Date.prototype.diffInDays = function(otherDate) {
  var d1;
  if (otherDate) {
    d1 = new Date(otherDate);
  } else {
    d1 = new Date();
  } 
  d1.setHours(1);
  d1.setMinutes(1);
  var d2 = new Date(this);
  d2.setHours(1);
  d2.setMinutes(1);
  return Math.round(Math.ceil(d2.getTime() - d1.getTime()) / ONE_DAY);
};

Date.prototype.addMinutes = function(mins) {
  return new Date(this.getTime() + minutes(mins));
}