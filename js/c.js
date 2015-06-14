var activityIndicatorOff, activityIndicatorOn, animateLoad, bindClickTargets, bindClicks, browserBeware, byteCount, checkFileVersion, checkTaxonNear, clearSearch, d$, deepJQuery, delay, doCORSget, doFontExceptions, downloadCSVList, downloadHTMLList, foo, formatAlien, formatScientificNames, formatSearchResults, getFilters, getLocation, getMaxZ, goTo, insertCORSWorkaround, insertModalImage, isBlank, isBool, isEmpty, isJson, isNull, isNumber, isNumeric, lightboxImages, loadJS, mapNewWindows, modalTaxon, openLink, openTab, overlayOff, overlayOn, parseTaxonYear, performSearch, prepURI, randomInt, root, roundNumber, searchParams, setHistory, showBadSearchErrorMessage, sortResults, ssar, stopLoad, stopLoadError, toFloat, toInt, toObject, toastStatusMessage, uri,
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

root = typeof exports !== "undefined" && exports !== null ? exports : this;

uri = new Object();

uri.o = $.url();

uri.urlString = uri.o.attr('protocol') + '://' + uri.o.attr('host') + uri.o.attr("directory");

uri.query = uri.o.attr("fragment");

window.locationData = new Object();

locationData.params = {
  enableHighAccuracy: true
};

locationData.last = void 0;

isBool = function(str) {
  return str === true || str === false;
};

isEmpty = function(str) {
  return !str || str.length === 0;
};

isBlank = function(str) {
  return !str || /^\s*$/.test(str);
};

isNull = function(str) {
  try {
    if (isEmpty(str) || isBlank(str) || (str == null)) {
      if (!(str === false || str === 0)) {
        return true;
      }
    }
  } catch (_error) {

  }
  return false;
};

isJson = function(str) {
  if (typeof str === 'object') {
    return true;
  }
  try {
    JSON.parse(str);
    return true;
  } catch (_error) {

  }
  return false;
};

isNumber = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
};

isNumeric = function(n) {
  return isNumber(n);
};

toFloat = function(str, strict) {
  if (strict == null) {
    strict = false;
  }
  if (!isNumber(str) || isNull(str)) {
    if (strict) {
      return NaN;
    }
    return 0;
  }
  return parseFloat(str);
};

toInt = function(str, strict) {
  if (strict == null) {
    strict = false;
  }
  if (!isNumber(str) || isNull(str)) {
    if (strict) {
      return NaN;
    }
    return 0;
  }
  return parseInt(str);
};

toObject = function(array) {
  var element, index, rv;
  rv = new Object();
  for (index in array) {
    element = array[index];
    if (element !== void 0) {
      rv[index] = element;
    }
  }
  return rv;
};

String.prototype.toBool = function() {
  return this.toString() === 'true';
};

Boolean.prototype.toBool = function() {
  return this.toString() === 'true';
};

Number.prototype.toBool = function() {
  return this.toString() === "1";
};

Object.size = function(obj) {
  var key, size;
  size = 0;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      size++;
    }
  }
  return size;
};

delay = function(ms, f) {
  return setTimeout(f, ms);
};

roundNumber = function(number, digits) {
  var multiple;
  if (digits == null) {
    digits = 0;
  }
  multiple = Math.pow(10, digits);
  return Math.round(number * multiple) / multiple;
};

jQuery.fn.exists = function() {
  return jQuery(this).length > 0;
};

jQuery.fn.polymerSelected = function(setSelected) {
  var childDropdown, e, index, item, prop, val;
  if (setSelected == null) {
    setSelected = void 0;
  }
  if (setSelected != null) {
    if (!isBool(setSelected)) {
      try {
        childDropdown = $(this).find("[valueattr]");
        if (isNull(childDropdown)) {
          childDropdown = $(this);
        }
        prop = childDropdown.attr("valueattr");
        item = $(this).find("[" + prop + "=" + setSelected + "]");
        index = item.index();
        return item.parent().prop("selected", index);
      } catch (_error) {
        e = _error;
        return false;
      }
    } else {
      console.log("setSelected " + setSelected + " is boolean");
      $(this).parent().children().removeAttribute("selected");
      $(this).parent().children().removeAttribute("active");
      $(this).parent().children().removeClass("core-selected");
      $(this).prop("selected", setSelected);
      $(this).prop("active", setSelected);
      if (setSelected === true) {
        return $(this).addClass("core-selected");
      }
    }
  } else {
    val = void 0;
    try {
      childDropdown = $(this).find("[valueattr]");
      if (isNull(childDropdown)) {
        childDropdown = $(this);
      }
      prop = childDropdown.attr("valueattr");
      val = $(this).find(".core-selected").attr(prop);
    } catch (_error) {
      e = _error;
      return false;
    }
    if (val === "null" || (val == null)) {
      val = void 0;
    }
    return val;
  }
};

jQuery.fn.polymerChecked = function(setChecked) {
  var val;
  if (setChecked == null) {
    setChecked = void 0;
  }
  if (setChecked != null) {
    return jQuery(this).prop("checked", setChecked);
  } else {
    val = jQuery(this)[0].checked;
    if (val === "null" || (val == null)) {
      val = void 0;
    }
    return val;
  }
};

jQuery.fn.isVisible = function() {
  return jQuery(this).css("display") !== "none";
};

jQuery.fn.hasChildren = function() {
  return Object.size(jQuery(this).children()) > 3;
};

byteCount = (function(_this) {
  return function(s) {
    return encodeURI(s).split(/%..|./).length - 1;
  };
})(this);

function shuffle(o) { //v1.0
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

randomInt = function(lower, upper) {
  var start, _ref, _ref1;
  if (lower == null) {
    lower = 0;
  }
  if (upper == null) {
    upper = 1;
  }
  start = Math.random();
  if (lower == null) {
    _ref = [0, lower], lower = _ref[0], upper = _ref[1];
  }
  if (lower > upper) {
    _ref1 = [upper, lower], lower = _ref1[0], upper = _ref1[1];
  }
  return Math.floor(start * (upper - lower + 1) + lower);
};

window.debounce_timer = null;

({
  debounce: function(func, threshold, execAsap) {
    if (threshold == null) {
      threshold = 300;
    }
    if (execAsap == null) {
      execAsap = false;
    }
    return function() {
      var args, delayed, obj;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      obj = this;
      delayed = function() {
        if (!execAsap) {
          return func.apply(obj, args);
        }
      };
      if (window.debounce_timer != null) {
        clearTimeout(window.debounce_timer);
      } else if (execAsap) {
        func.apply(obj, args);
      }
      return window.debounce_timer = setTimeout(delayed, threshold);
    };
  }
});

Function.prototype.debounce = function() {
  var args, delayed, e, execAsap, func, threshold, timeout;
  threshold = arguments[0], execAsap = arguments[1], timeout = arguments[2], args = 4 <= arguments.length ? __slice.call(arguments, 3) : [];
  if (threshold == null) {
    threshold = 300;
  }
  if (execAsap == null) {
    execAsap = false;
  }
  if (timeout == null) {
    timeout = window.debounce_timer;
  }
  func = this;
  delayed = function() {
    if (!execAsap) {
      func.apply(func, args);
    }
    return console.log("Debounce applied");
  };
  if (timeout != null) {
    try {
      clearTimeout(timeout);
    } catch (_error) {
      e = _error;
    }
  } else if (execAsap) {
    func.apply(obj, args);
    console.log("Executed immediately");
  }
  return window.debounce_timer = setTimeout(delayed, threshold);
};

loadJS = function(src, callback, doCallbackOnError) {
  var e, errorFunction, onLoadFunction, s;
  if (callback == null) {
    callback = new Object();
  }
  if (doCallbackOnError == null) {
    doCallbackOnError = true;
  }

  /*
   * Load a new javascript file
   *
   * If it's already been loaded, jump straight to the callback
   *
   * @param string src The source URL of the file
   * @param function callback Function to execute after the script has
   *                          been loaded
   * @param bool doCallbackOnError Should the callback be executed if
   *                               loading the script produces an error?
   */
  if ($("script[src='" + src + "']").exists()) {
    if (typeof callback === "function") {
      try {
        callback();
      } catch (_error) {
        e = _error;
        console.error("Script is already loaded, but there was an error executing the callback function - " + e.message);
      }
    }
    return true;
  }
  s = document.createElement("script");
  s.setAttribute("src", src);
  s.setAttribute("async", "async");
  s.setAttribute("type", "text/javascript");
  s.src = src;
  s.async = true;
  onLoadFunction = function() {
    var state;
    state = s.readyState;
    try {
      if (!callback.done && (!state || /loaded|complete/.test(state))) {
        callback.done = true;
        if (typeof callback === "function") {
          try {
            return callback();
          } catch (_error) {
            e = _error;
            return console.error("Postload callback error - " + e.message);
          }
        }
      }
    } catch (_error) {
      e = _error;
      return console.error("Onload error - " + e.message);
    }
  };
  errorFunction = function() {
    console.warn("There may have been a problem loading " + src);
    try {
      if (!callback.done) {
        callback.done = true;
        if (typeof callback === "function" && doCallbackOnError) {
          try {
            return callback();
          } catch (_error) {
            e = _error;
            return console.error("Post error callback error - " + e.message);
          }
        }
      }
    } catch (_error) {
      e = _error;
      return console.error("There was an error in the error handler! " + e.message);
    }
  };
  s.setAttribute("onload", onLoadFunction);
  s.setAttribute("onreadystate", onLoadFunction);
  s.setAttribute("onerror", errorFunction);
  s.onload = s.onreadystate = onLoadFunction;
  s.onerror = errorFunction;
  document.getElementsByTagName('head')[0].appendChild(s);
  return true;
};

String.prototype.toTitleCase = function() {
  var lower, lowerRegEx, lowers, str, upper, upperRegEx, uppers, _i, _j, _len, _len1;
  str = this.replace(/([^\W_]+[^\s-]*) */g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
  lowers = ["A", "An", "The", "And", "But", "Or", "For", "Nor", "As", "At", "By", "For", "From", "In", "Into", "Near", "Of", "On", "Onto", "To", "With"];
  for (_i = 0, _len = lowers.length; _i < _len; _i++) {
    lower = lowers[_i];
    lowerRegEx = new RegExp("\\s" + lower + "\\s", "g");
    str = str.replace(lowerRegEx, function(txt) {
      return txt.toLowerCase();
    });
  }
  uppers = ["Id", "Tv"];
  for (_j = 0, _len1 = uppers.length; _j < _len1; _j++) {
    upper = uppers[_j];
    upperRegEx = new RegExp("\\b" + upper + "\\b", "g");
    str = str.replace(upperRegEx, upper.toUpperCase());
  }
  return str;
};

mapNewWindows = function(stopPropagation) {
  if (stopPropagation == null) {
    stopPropagation = true;
  }
  return $(".newwindow").each(function() {
    var curHref, openInNewWindow;
    curHref = $(this).attr("href");
    if (curHref == null) {
      curHref = $(this).attr("data-href");
    }
    openInNewWindow = function(url) {
      if (url == null) {
        return false;
      }
      window.open(url);
      return false;
    };
    $(this).click(function(e) {
      if (stopPropagation) {
        e.preventDefault();
        e.stopPropagation();
      }
      return openInNewWindow(curHref);
    });
    return $(this).keypress(function() {
      return openInNewWindow(curHref);
    });
  });
};

toastStatusMessage = function(message, className, duration, selector) {
  var html;
  if (className == null) {
    className = "";
  }
  if (duration == null) {
    duration = 3000;
  }
  if (selector == null) {
    selector = "#search-status";
  }

  /*
   * Pop up a status message
   */
  if (!isNumber(duration)) {
    duration = 3000;
  }
  if (selector.slice(0, 1) === !"#") {
    selector = "#" + selector;
  }
  if (!$(selector).exists()) {
    html = "<paper-toast id=\"" + (selector.slice(1)) + "\" duration=\"" + duration + "\"></paper-toast>";
    $(html).appendTo("body");
  }
  $(selector).attr("text", message);
  $(selector).addClass(className);
  $(selector)[0].show();
  return delay(duration + 500, function() {
    $(selector).empty();
    $(selector).removeClass(className);
    return $(selector).attr("text", "");
  });
};

openLink = function(url) {
  if (url == null) {
    return false;
  }
  window.open(url);
  return false;
};

openTab = function(url) {
  return openLink(url);
};

goTo = function(url) {
  if (url == null) {
    return false;
  }
  window.location.href = url;
  return false;
};

animateLoad = function(elId) {
  var e, selector;
  if (elId == null) {
    elId = "loader";
  }

  /*
   * Suggested CSS to go with this:
   *
   * #loader {
   *     position:fixed;
   *     top:50%;
   *     left:50%;
   * }
   * #loader.good::shadow .circle {
   *     border-color: rgba(46,190,17,0.9);
   * }
   * #loader.bad::shadow .circle {
   *     border-color:rgba(255,0,0,0.9);
   * }
   */
  if (isNumber(elId)) {
    elId = "loader";
  }
  if (elId.slice(0, 1) === "#") {
    selector = elId;
    elId = elId.slice(1);
  } else {
    selector = "#" + elId;
  }
  try {
    if (!$(selector).exists()) {
      $("body").append("<paper-spinner id=\"" + elId + "\" active></paper-spinner");
    } else {
      $(selector).attr("active", true);
    }
    return false;
  } catch (_error) {
    e = _error;
    return console.warn('Could not animate loader', e.message);
  }
};

stopLoad = function(elId, fadeOut) {
  var e, selector;
  if (elId == null) {
    elId = "loader";
  }
  if (fadeOut == null) {
    fadeOut = 1000;
  }
  if (elId.slice(0, 1) === "#") {
    selector = elId;
    elId = elId.slice(1);
  } else {
    selector = "#" + elId;
  }
  try {
    if ($(selector).exists()) {
      $(selector).addClass("good");
      return delay(fadeOut, function() {
        $(selector).removeClass("good");
        $(selector).attr("active", false);
        return $(selector).removeAttr("active");
      });
    }
  } catch (_error) {
    e = _error;
    return console.warn('Could not stop load animation', e.message);
  }
};

stopLoadError = function(message, elId, fadeOut) {
  var e, selector;
  if (elId == null) {
    elId = "loader";
  }
  if (fadeOut == null) {
    fadeOut = 7500;
  }
  if (elId.slice(0, 1) === "#") {
    selector = elId;
    elId = elId.slice(1);
  } else {
    selector = "#" + elId;
  }
  try {
    if ($(selector).exists()) {
      $(selector).addClass("bad");
      if (message != null) {
        toastStatusMessage(message, "", fadeOut);
      }
      return delay(fadeOut, function() {
        $(selector).removeClass("bad");
        return $(selector).attr("active", false);
      });
    }
  } catch (_error) {
    e = _error;
    return console.warn('Could not stop load error animation', e.message);
  }
};

doCORSget = function(url, args, callback, callbackFail) {
  var corsFail, createCORSRequest, e, settings, xhr;
  if (callback == null) {
    callback = void 0;
  }
  if (callbackFail == null) {
    callbackFail = void 0;
  }
  corsFail = function() {
    if (typeof callbackFail === "function") {
      return callbackFail();
    } else {
      throw new Error("There was an error performing the CORS request");
    }
  };
  settings = {
    url: url,
    data: args,
    type: "get",
    crossDomain: true
  };
  try {
    $.ajax(settings).done(function(result) {
      if (typeof callback === "function") {
        callback();
        return false;
      }
    }).fail(function(result, status) {
      return console.warn("Couldn't perform jQuery AJAX CORS. Attempting manually.");
    });
  } catch (_error) {
    e = _error;
    console.warn("There was an error using jQuery to perform the CORS request. Attemping manually.");
  }
  url = "" + url + "?" + args;
  createCORSRequest = function(method, url) {
    var xhr;
    if (method == null) {
      method = "get";
    }
    xhr = new XMLHttpRequest();
    if ("withCredentials" in xhr) {
      xhr.open(method, url, true);
    } else if (typeof XDomainRequest !== "undefined") {
      xhr = new XDomainRequest();
      xhr.open(method, url);
    } else {
      xhr = null;
    }
    return xhr;
  };
  xhr = createCORSRequest("get", url);
  if (!xhr) {
    throw new Error("CORS not supported");
  }
  xhr.onload = function() {
    var response;
    response = xhr.responseText;
    if (typeof callback === "function") {
      callback(response);
    }
    return false;
  };
  xhr.onerror = function() {
    console.warn("Couldn't do manual XMLHttp CORS request");
    return corsFail();
  };
  xhr.send();
  return false;
};

deepJQuery = function(selector) {

  /*
   * Do a shadow-piercing selector
   *
   * Cross-browser, works with Chrome, Firefox, Opera, Safari, and IE
   * Falls back to standard jQuery selector when everything fails.
   */
  var e;
  try {
    if (!$("html /deep/ " + selector).exists()) {
      throw "Bad /deep/ selector";
    }
    return $("html /deep/ " + selector);
  } catch (_error) {
    e = _error;
    try {
      if (!$("html >>> " + selector).exists()) {
        throw "Bad >>> selector";
      }
      return $("html >>> " + selector);
    } catch (_error) {
      e = _error;
      return $(selector);
    }
  }
};

d$ = function(selector) {
  return deepJQuery(selector);
};

lightboxImages = function(selector, lookDeeply) {
  var jqo, options;
  if (selector == null) {
    selector = ".lightboximage";
  }
  if (lookDeeply == null) {
    lookDeeply = false;
  }

  /*
   * Lightbox images with this selector
   *
   * If the image has it, wrap it in an anchor and bind;
   * otherwise just apply to the selector.
   *
   * Plays nice with layzr.js
   * https://callmecavs.github.io/layzr.js/
   */
  options = {
    onStart: function() {
      return overlayOn();
    },
    onEnd: function() {
      overlayOff();
      return activityIndicatorOff();
    },
    onLoadStart: function() {
      return activityIndicatorOn();
    },
    onLoadEnd: function() {
      return activityIndicatorOff();
    },
    allowedTypes: 'png|jpg|jpeg|gif|bmp|webp',
    quitOnDocClick: true,
    quitOnImgClick: true
  };
  jqo = lookDeeply ? d$(selector) : $(selector);
  return jqo.click(function(e) {
    try {
      $(this).imageLightbox(options).startImageLightbox();
      e.preventDefault();
      e.stopPropagation();
      return console.warn("Event propagation was stopped when clicking on this.");
    } catch (_error) {
      e = _error;
      return console.error("Unable to lightbox this image!");
    }
  }).each(function() {
    var e, imgUrl, tagHtml;
    try {
      if ($(this).prop("tagName").toLowerCase() === "img" && $(this).parent().prop("tagName").toLowerCase() !== "a") {
        tagHtml = $(this).removeClass("lightboximage").prop("outerHTML");
        imgUrl = (function() {
          switch (false) {
            case !!isNull($(this).attr("data-layzr-retina")):
              return $(this).attr("data-layzr-retina");
            case !!isNull($(this).attr("data-layzr")):
              return $(this).attr("data-layzr");
            default:
              return $(this).attr("src");
          }
        }).call(this);
        return $(this).replaceWith("<a href='" + imgUrl + "' class='lightboximage'>" + tagHtml + "</a>");
      }
    } catch (_error) {
      e = _error;
      return console.warn("Couldn't parse through the elements");
    }
  });
};

activityIndicatorOn = function() {
  return $('<div id="imagelightbox-loading"><div></div></div>').appendTo('body');
};

activityIndicatorOff = function() {
  $('#imagelightbox-loading').remove();
  return $("#imagelightbox-overlay").click(function() {
    return $("#imagelightbox").click();
  });
};

overlayOn = function() {
  return $('<div id="imagelightbox-overlay"></div>').appendTo('body');
};

overlayOff = function() {
  return $('#imagelightbox-overlay').remove();
};

formatScientificNames = function(selector) {
  if (selector == null) {
    selector = ".sciname";
  }
  return $(".sciname").each(function() {
    var nameStyle;
    nameStyle = $(this).css("font-style") === "italic" ? "normal" : "italic";
    return $(this).css("font-style", nameStyle);
  });
};

prepURI = function(string) {
  string = encodeURIComponent(string);
  return string.replace(/%20/g, "+");
};

getLocation = function(callback) {
  var geoFail, geoSuccess;
  if (callback == null) {
    callback = void 0;
  }
  geoSuccess = function(pos, callback) {
    window.locationData.lat = pos.coords.latitude;
    window.locationData.lng = pos.coords.longitude;
    window.locationData.acc = pos.coords.accuracy;
    window.locationData.last = Date.now();
    if (callback != null) {
      callback(window.locationData);
    }
    return false;
  };
  geoFail = function(error, callback) {
    var locationError;
    locationError = (function() {
      switch (error.code) {
        case 0:
          return "There was an error while retrieving your location: " + error.message;
        case 1:
          return "The user prevented this page from retrieving a location";
        case 2:
          return "The browser was unable to determine your location: " + error.message;
        case 3:
          return "The browser timed out retrieving your location.";
      }
    })();
    console.error(locationError);
    if (callback != null) {
      callback(false);
    }
    return false;
  };
  if (navigator.geolocation) {
    return navigator.geolocation.getCurrentPosition(geoSuccess, geoFail, window.locationData.params);
  } else {
    console.warn("This browser doesn't support geolocation!");
    if (callback != null) {
      return callback(false);
    }
  }
};

bindClickTargets = function() {
  bindClicks();
  return false;
};

bindClicks = function(selector) {
  if (selector == null) {
    selector = ".click";
  }

  /*
   * Helper function. Bind everything with a selector
   * to execute a function data-function or to go to a
   * URL data-href.
   */
  $(selector).each(function() {
    var callable, e, url;
    try {
      url = $(this).attr("data-href");
      if (isNull(url)) {
        url = $(this).attr("data-url");
        if (url != null) {
          $(this).attr("data-newtab", "true");
        }
      }
      if (!isNull(url)) {
        $(this).unbind();
        try {
          if (url === uri.o.attr("path") && $(this).prop("tagName").toLowerCase() === "paper-tab") {
            $(this).parent().prop("selected", $(this).index());
          }
        } catch (_error) {
          e = _error;
          console.warn("tagname lower case error");
        }
        $(this).click(function() {
          var _ref, _ref1, _ref2;
          if (((_ref = $(this).attr("newTab")) != null ? _ref.toBool() : void 0) || ((_ref1 = $(this).attr("newtab")) != null ? _ref1.toBool() : void 0) || ((_ref2 = $(this).attr("data-newtab")) != null ? _ref2.toBool() : void 0)) {
            return openTab(url);
          } else {
            return goTo(url);
          }
        });
        return url;
      } else {
        callable = $(this).attr("data-function");
        if (callable != null) {
          $(this).unbind();
          return $(this).click(function() {
            try {
              return window[callable]();
            } catch (_error) {
              e = _error;
              return console.error("'" + callable + "()' is a bad function - " + e.message);
            }
          });
        }
      }
    } catch (_error) {
      e = _error;
      return console.error("There was a problem binding to #" + ($(this).attr("id")) + " - " + e.message);
    }
  });
  return false;
};

getMaxZ = function() {
  var mapFunction;
  mapFunction = function() {
    return $.map($("body *"), function(e, n) {
      if ($(e).css("position") !== "static") {
        return parseInt($(e).css("z-index") || 1);
      }
    });
  };
  return Math.max.apply(null, mapFunction());
};

browserBeware = function() {
  var browsers, e, warnBrowserHtml;
  if (window.hasCheckedBrowser == null) {
    window.hasCheckedBrowser = 0;
  }
  try {
    browsers = new WhichBrowser();
    if (browsers.isBrowser("Firefox")) {
      warnBrowserHtml = "<div id=\"firefox-warning\" class=\"alert alert-warning alert-dismissible fade in\" role=\"alert\">\n  <button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button>\n  <strong>Warning!</strong> Firefox has buggy support for <a href=\"http://webcomponents.org/\" class=\"alert-link\">webcomponents</a> and the <a href=\"https://www.polymer-project.org\" class=\"alert-link\">Polymer project</a>. If you encounter bugs, try using Chrome (recommended), Opera, Safari, Internet Explorer, or your phone instead &#8212; they'll all be faster, too.\n</div>";
      $("#title").after(warnBrowserHtml);
      $(".alert").alert();
      console.warn("We've noticed you're using Firefox. Firefox has problems with this site, we recommend trying Google Chrome instead:", "https://www.google.com/chrome/");
      console.warn("Firefox took " + (window.hasCheckedBrowser * 250) + "ms after page load to render this error message.");
    }
    if (browsers.isBrowser("Internet Explorer")) {
      return $("#collapse-button").click(function() {
        return $(".collapse").collapse("toggle");
      });
    }
  } catch (_error) {
    e = _error;
    if (window.hasCheckedBrowser === 100) {
      console.warn("We can't check your browser! If you're using Firefox, beware of bugs!");
      return false;
    }
    return delay(250, function() {
      window.hasCheckedBrowser++;
      return browserBeware();
    });
  }
};

checkFileVersion = function(forceNow) {
  var checkVersion;
  if (forceNow == null) {
    forceNow = false;
  }

  /*
   * Check to see if the file on the server is up-to-date with what the
   * user sees.
   *
   * @param bool forceNow force a check now
   */
  checkVersion = function() {
    return $.get("" + uri.urlString + "meta.php", "do=get_last_mod", "json").done(function(result) {
      var html;
      if (forceNow) {
        console.log("Forced version check:", result);
      }
      if (!isNumber(result.last_mod)) {
        return false;
      }
      if (ssar.lastMod == null) {
        ssar.lastMod = result.last_mod;
      }
      if (result.last_mod > ssar.lastMod) {
        html = "<div id=\"outdated-warning\" class=\"alert alert-info alert-dismissible fade in\" role=\"alert\">\n  <button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button>\n  <strong>We have page updates!</strong> This page has been updated since you last refreshed. <a class=\"alert-link\" id=\"refresh-page\" style=\"cursor:pointer\">Click here to refresh now</a> and get bugfixes and updates.\n</div>";
        if (!$("#outdated-warning").exists()) {
          $("body").append(html);
          $("#refresh-page").click(function() {
            return document.location.reload(true);
          });
        }
        return console.warn("Your current version is out of date! Please refresh the page.");
      } else if (forceNow) {
        return console.log("Your version is up to date: have " + ssar.lastMod + ", got " + result.last_mod);
      }
    }).fail(function() {
      return console.warn("Couldn't check file version!!");
    }).always(function() {
      return delay(5 * 60 * 1000, function() {
        return checkVersion();
      });
    });
  };
  if (forceNow || (ssar.lastMod == null)) {
    checkVersion();
    return true;
  }
  return false;
};

foo = function() {
  toastStatusMessage("Sorry, this feature is not yet finished");
  stopLoad();
  return false;
};

$(function() {
  var e;
  bindClicks();
  formatScientificNames();
  try {
    $('[data-toggle="tooltip"]').tooltip();
  } catch (_error) {
    e = _error;
    console.warn("Tooltips were attempted to be set up, but do not exist");
  }
  try {
    checkAdmin();
    if ((typeof adminParams !== "undefined" && adminParams !== null ? adminParams.loadAdminUi : void 0) === true) {
      loadJS("js/admin.min.js", function() {
        return loadAdminUi();
      });
    }
  } catch (_error) {
    e = _error;
    getLocation();
    loadJS("js/jquery.cookie.min.js", function() {
      var html;
      if ($.cookie("ssarherps_user") != null) {
        html = "<paper-icon-button icon=\"create\" class=\"click\" data-href=\"" + uri.urlString + "admin/\" data-toggle=\"tooltip\" title=\"Go to administration\" id=\"goto-admin\"></paper-icon-button>";
        $("#bug-footer").append(html);
        bindClicks("#goto-admin");
        $("#goto-admin").tooltip();
      }
      return false;
    });
  }
  browserBeware();
  return checkFileVersion();
});

searchParams = new Object();

searchParams.targetApi = "commonnames_api.php";

searchParams.targetContainer = "#result_container";

searchParams.apiPath = uri.urlString + searchParams.targetApi;

ssar = new Object();

ssar.affiliateQueryUrl = {
  amphibiaWeb: "http://amphibiaweb.org/cgi/amphib_query",
  reptileDatabase: "http://reptile-database.reptarium.cz/species",
  calPhotos: "http://calphotos.berkeley.edu/cgi/img_query",
  iNaturalist: "https://www.inaturalist.org/taxa/search"
};

performSearch = function(stateArgs) {
  var args, filters, s, sOrig;
  if (stateArgs == null) {
    stateArgs = void 0;
  }

  /*
   * Check the fields and filters and do the async search
   */
  if (stateArgs == null) {
    s = $("#search").val();
    sOrig = s;
    s = s.toLowerCase();
    filters = getFilters();
    if ((isNull(s) || (s == null)) && isNull(filters)) {
      $("#search-status").attr("text", "Please enter a search term.");
      $("#search-status")[0].show();
      return false;
    }
    $("#search").blur();
    s = s.replace(/\./g, "");
    s = prepURI(s);
    if ($("#loose").polymerChecked()) {
      s = "" + s + "&loose=true";
    }
    if ($("#fuzzy").polymerChecked()) {
      s = "" + s + "&fuzzy=true";
    }
    if (!isNull(filters)) {
      s = "" + s + "&filter=" + filters;
    }
    args = "q=" + s;
  } else {
    if (stateArgs === true) {
      args = "q=";
      sOrig = "(all items)";
    } else {
      args = "q=" + stateArgs;
      sOrig = stateArgs.split("&")[0];
    }
    console.log("Searching on " + stateArgs);
  }
  if (s === "#" || (isNull(s) && isNull(args)) || (args === "q=" && stateArgs !== true)) {
    return false;
  }
  animateLoad();
  if (!isNull(filters)) {
    console.log("Got search value " + s + ", hitting", "" + searchParams.apiPath + "?" + args);
  }
  return $.get(searchParams.targetApi, args, "json").done(function(result) {
    if (toInt(result.count) === 0) {
      showBadSearchErrorMessage(result);
      clearSearch(true);
      return false;
    }
    if (result.status === true) {
      formatSearchResults(result);
      return false;
    }
    clearSearch(true);
    $("#search-status").attr("text", result.human_error);
    $("#search-status")[0].show();
    console.error(result.error);
    console.warn(result);
    return stopLoadError();
  }).fail(function(result, error) {
    console.error("There was an error performing the search");
    console.warn(result, error, result.statusText);
    error = "" + result.status + " - " + result.statusText;
    $("#search-status").attr("text", "Couldn't execute the search - " + error);
    $("#search-status")[0].show();
    return stopLoadError();
  }).always(function() {
    var b64s;
    b64s = Base64.encodeURI(s);
    if (s != null) {
      setHistory("" + uri.urlString + "#" + b64s);
    }
    return false;
  });
};

getFilters = function(selector, booleanType) {
  var alien, e, encodedFilter, filterList, jsonString;
  if (selector == null) {
    selector = ".cndb-filter";
  }
  if (booleanType == null) {
    booleanType = "AND";
  }

  /*
   * Look at $(selector) and apply the filters as per
   * https://github.com/tigerhawkvok/SSAR-species-database#search-flags
   * It's meant to work with Polymer dropdowns, but it'll fall back to <select><option>
   */
  filterList = new Object();
  $(selector).each(function() {
    var col, val;
    col = $(this).attr("data-column");
    if (col == null) {
      return true;
    }
    val = $(this).polymerSelected();
    if (val === "any" || val === "all" || val === "*") {
      return true;
    }
    if (isNull(val) || val === false) {
      val = $(this).val();
      if (isNull(val)) {
        return true;
      } else {

      }
    }
    return filterList[col] = val.toLowerCase();
  });
  alien = $("#alien-filter").get(0).selected;
  if (alien !== "both") {
    filterList.is_alien = alien === "alien-only" ? 1 : 0;
  }
  if (Object.size(filterList) === 0) {
    return "";
  }
  try {
    filterList["BOOLEAN_TYPE"] = booleanType;
    jsonString = JSON.stringify(filterList);
    encodedFilter = Base64.encodeURI(jsonString);
    return encodedFilter;
  } catch (_error) {
    e = _error;
    return false;
  }
};

formatSearchResults = function(result, container) {
  var alt, bootstrapColCount, bootstrapColSize, col, colClass, d, data, dontShowColumns, e, externalCounter, genus, headers, html, htmlClose, htmlHead, htmlRow, i, j, k, kClass, l, niceKey, renderTimeout, row, species, split, targetCount, taxonQuery, v, year, _results;
  if (container == null) {
    container = searchParams.targetContainer;
  }

  /*
   * Take a result object from the server's lookup, and format it to
   * display search results.
   * See
   * http://ssarherps.org/cndb/commonnames_api.php?q=batrachoseps+attenuatus&loose=true
   * for a sample search result return.
   */
  data = result.result;
  searchParams.result = data;
  headers = new Array();
  html = "";
  htmlHead = "<table id='cndb-result-list' class='table table-striped table-hover'>\n\t<tr class='cndb-row-headers'>";
  htmlClose = "</table>";
  targetCount = toInt(result.count) - 1;
  colClass = null;
  bootstrapColCount = 0;
  dontShowColumns = ["id", "minor_type", "notes", "major_type", "taxon_author", "taxon_credit", "image_license", "image_credit", "taxon_credit_date", "parens_auth_genus", "parens_auth_species", "is_alien"];
  externalCounter = 0;
  renderTimeout = delay(5000, function() {
    stopLoadError("There was a problem parsing the search results.");
    console.error("Couldn't finish parsing the results! Expecting " + targetCount + " elements, timed out on " + externalCounter + ".");
    console.warn(data);
    return false;
  });
  _results = [];
  for (i in data) {
    row = data[i];
    externalCounter = i;
    if (toInt(i) === 0) {
      j = 0;
      htmlHead += "\n<!-- Table Headers - " + (Object.size(row)) + " entries -->";
      for (k in row) {
        v = row[k];
        niceKey = k.replace(/_/g, " ");
        if (__indexOf.call(dontShowColumns, k) < 0) {
          if ($("#show-deprecated").polymerSelected() !== true) {
            alt = "deprecated_scientific";
          } else {
            alt = "";
          }
          if (k !== alt) {
            niceKey = (function() {
              switch (niceKey) {
                case "common name":
                  return "english name";
                case "major subtype":
                  return "english subtype";
                default:
                  return niceKey;
              }
            })();
            htmlHead += "\n\t\t<th class='text-center'>" + niceKey + "</th>";
            bootstrapColCount++;
          }
        }
        j++;
        if (j === Object.size(row)) {
          htmlHead += "\n\t</tr>";
          htmlHead += "\n<!-- End Table Headers -->";
          bootstrapColSize = roundNumber(12 / bootstrapColCount, 0);
          colClass = "col-md-" + bootstrapColSize;
        }
      }
    }
    taxonQuery = "" + row.genus + "+" + row.species;
    if (!isNull(row.subspecies)) {
      taxonQuery = "" + taxonQuery + "+" + row.subspecies;
    }
    htmlRow = "\n\t<tr id='cndb-row" + i + "' class='cndb-result-entry' data-taxon=\"" + taxonQuery + "\">";
    l = 0;
    for (k in row) {
      col = row[k];
      if (__indexOf.call(dontShowColumns, k) < 0) {
        if (k === "authority_year") {
          try {
            try {
              d = JSON.parse(col);
            } catch (_error) {
              e = _error;
              console.warn("There was an error parsing '" + col + "', attempting to fix - ", e.message);
              split = col.split(":");
              year = split[1].slice(split[1].search("\"") + 1, -2);
              console.log("Examining " + year);
              year = year.replace(/"/g, "'");
              split[1] = "\"" + year + "\"}";
              col = split.join(":");
              console.log("Reconstructed " + col);
              d = JSON.parse(col);
            }
            genus = Object.keys(d)[0];
            species = d[genus];
            col = "G: " + genus + "<br/>S: " + species;
          } catch (_error) {
            e = _error;
            console.error("There was an error parsing '" + col + "'", e.message);
            d = col;
          }
        }
        if ($("#show-deprecated").polymerSelected() !== true) {
          alt = "deprecated_scientific";
        } else {
          alt = "";
        }
        if (k !== alt) {
          if (k === "image") {
            if (isNull(col)) {
              col = "<paper-icon-button icon='launch' data-href='" + ssar.affiliateQueryUrl.calPhotos + "?rel-taxon=contains&where-taxon=" + taxonQuery + "' class='newwindow calphoto click' data-taxon=\"" + taxonQuery + "\"></paper-icon-button>";
            } else {
              col = "<paper-icon-button icon='image:image' data-lightbox='" + uri.urlString + col + "' class='lightboximage'></paper-icon-button>";
            }
          }
          if (k !== "genus" && k !== "species" && k !== "subspecies") {
            kClass = "" + k + " text-center";
          } else {
            kClass = k;
          }
          if (k === "genus_authority" || k === "species_authority") {
            kClass += " authority";
          }
          htmlRow += "\n\t\t<td id='" + k + "-" + i + "' class='" + kClass + " " + colClass + "'>" + col + "</td>";
        }
      }
      l++;
      if (l === Object.size(row)) {
        htmlRow += "\n\t</tr>";
        html += htmlRow;
      }
    }
    if (toInt(i) === targetCount) {
      html = htmlHead + html + htmlClose;
      $(container).html(html);
      clearTimeout(renderTimeout);
      mapNewWindows();
      lightboxImages();
      modalTaxon();
      doFontExceptions();
      $("#result-count").text(" - " + result.count + " entries");
      insertCORSWorkaround();
      _results.push(stopLoad());
    } else {
      _results.push(void 0);
    }
  }
  return _results;
};

parseTaxonYear = function(taxonYearString, strict) {
  var d, e, genus, species, split, year;
  if (strict == null) {
    strict = true;
  }

  /*
   * Take the (theoretically nicely JSON-encoded) taxon year/authority
   * string and turn it into a canonical object for the modal dialog to use
   */
  try {
    d = JSON.parse(taxonYearString);
  } catch (_error) {
    e = _error;
    console.warn("There was an error parsing '" + taxonYearString + "', attempting to fix - ", e.message);
    split = taxonYearString.split(":");
    year = split[1].slice(split[1].search('"') + 1, -2);
    console.log("Examining " + year);
    year = year.replace(/"/g, "'");
    split[1] = "\"" + year + "\"}";
    taxonYearString = split.join(":");
    console.log("Reconstructed " + taxonYearString);
    try {
      d = JSON.parse(taxonYearString);
    } catch (_error) {
      e = _error;
      if (strict) {
        return false;
      } else {
        return taxonYearString;
      }
    }
  }
  genus = Object.keys(d)[0];
  species = d[genus];
  year = new Object();
  year.genus = genus;
  year.species = species;
  return year;
};

formatAlien = function(dataOrAlienBool, selector) {
  var iconHtml, isAlien, tooltipHint, tooltipHtml;
  if (selector == null) {
    selector = "#is-alien-container";
  }

  /*
   * Quick handler to determine if the taxon is alien, and if so, label
   * it
   *
   * After
   * https://github.com/SSARHERPS/SSAR-species-database/issues/51
   * https://github.com/SSARHERPS/SSAR-species-database/issues/52
   */
  if (typeof dataOrAlienBool === "boolean") {
    isAlien = dataOrAlienBool;
  } else if (typeof dataOrAlienBool === "object") {
    isAlien = toInt(dataOrAlienBool.is_alien).toBool();
  } else {
    throw Error("Invalid data given to formatAlien()");
  }
  if (!isAlien) {
    d$(selector).css("display", "none");
    return false;
  }
  iconHtml = "<core-icon icon=\"maps:flight\" class=\"small-icon alien-speices\" id=\"modal-alien-species\" data-toggle=\"tooltip\"></core-icon>";
  d$(selector).html(iconHtml);
  tooltipHint = "This species is not native";
  tooltipHtml = "<div class=\"tooltip fade top in right manual-placement-tooltip\" role=\"tooltip\" style=\"top: 6.5em; left: 4em; right:initial; display:none\" id=\"manual-alien-tooltip\">\n  <div class=\"tooltip-arrow\" style=\"top:50%;left:5px\"></div>\n  <div class=\"tooltip-inner\">" + tooltipHint + "</div>\n</div>";
  d$(selector).after(tooltipHtml).mouseenter(function() {
    d$("#manual-alien-tooltip").css("display", "block");
    return false;
  }).mouseleave(function() {
    d$("#manual-alien-tooltip").css("display", "none");
    return false;
  });
  d$("#manual-location-tooltip").css("left", "6em");
  return false;
};

checkTaxonNear = function(taxonQuery, callback, selector) {
  var apiUrl, args, cssClass, elapsed, geoIcon, tooltipHint;
  if (taxonQuery == null) {
    taxonQuery = void 0;
  }
  if (callback == null) {
    callback = void 0;
  }
  if (selector == null) {
    selector = "#near-me-container";
  }

  /*
   * Check the iNaturalist API to see if the taxon is in your county
   * See https://github.com/tigerhawkvok/SSAR-species-database/issues/7
   */
  if (taxonQuery == null) {
    console.warn("Please specify a taxon.");
    return false;
  }
  if (locationData.last == null) {
    getLocation();
  }
  elapsed = (Date.now() - locationData.last) / 1000;
  if (elapsed > 15 * 60) {
    getLocation();
  }
  apiUrl = "http://www.inaturalist.org/places.json";
  args = "taxon=" + taxonQuery + "&latitude=" + locationData.lat + "&longitude=" + locationData.lng + "&place_type=county";
  geoIcon = "";
  cssClass = "";
  tooltipHint = "";
  $.get(apiUrl, args, "json").done(function(result) {
    if (Object.size(result) > 0) {
      geoIcon = "communication:location-on";
      cssClass = "good-location";
      return tooltipHint = "This species occurs in your county";
    } else {
      geoIcon = "communication:location-off";
      cssClass = "bad-location";
      return tooltipHint = "This species does not occur in your county";
    }
  }).fail(function(result, status) {
    cssClass = "bad-location";
    geoIcon = "warning";
    return tooltipHint = "We couldn't determine your location";
  }).always(function() {
    var tooltipHtml;
    tooltipHtml = "<div class=\"tooltip fade top in right manual-placement-tooltip\" role=\"tooltip\" style=\"top: 6.5em; left: 4em; right:initial; display:none\" id=\"manual-location-tooltip\">\n  <div class=\"tooltip-arrow\" style=\"top:50%;left:5px\"></div>\n  <div class=\"tooltip-inner\">" + tooltipHint + "</div>\n</div>";
    d$(selector).html("<core-icon icon='" + geoIcon + "' class='small-icon " + cssClass + " near-me' data-toggle='tooltip' id='near-me-icon'></core-icon>");
    $(selector).after(tooltipHtml).mouseenter(function() {
      d$("#manual-location-tooltip").css("display", "block");
      return false;
    }).mouseleave(function() {
      d$("#manual-location-tooltip").css("display", "none");
      return false;
    });
    if (callback != null) {
      return callback();
    }
  });
  return false;
};

insertModalImage = function(imageObject, taxon, callback) {
  var args, doneCORS, e, extension, failCORS, imageUrl, imgArray, imgPath, insertImage, taxonArray, taxonString, warnArgs;
  if (imageObject == null) {
    imageObject = ssar.taxonImage;
  }
  if (taxon == null) {
    taxon = ssar.activeTaxon;
  }
  if (callback == null) {
    callback = void 0;
  }

  /*
   * Insert into the taxon modal a lightboxable photo. If none exists,
   * load from CalPhotos
   *
   * CalPhotos functionality blocked on
   * https://github.com/tigerhawkvok/SSAR-species-database/issues/30
   */
  if (taxon == null) {
    console.error("Tried to insert a modal image, but no taxon was provided!");
    return false;
  }
  if (typeof taxon !== "object") {
    console.error("Invalid taxon data type (expecting object), got " + (typeof taxon));
    warnArgs = {
      taxon: taxon,
      imageUrl: imageUrl,
      defaultTaxon: ssar.activeTaxon,
      defaultImage: ssar.taxonImage
    };
    console.warn(warnArgs);
    return false;
  }
  insertImage = function(image, taxonQueryString, classPrefix) {
    var e, html, imgCredit, imgLicense, largeImg, largeImgLink, thumbnail;
    if (classPrefix == null) {
      classPrefix = "calphoto";
    }

    /*
     * Insert a lightboxed image into the modal taxon dialog. This must
     * be shadow-piercing, since the modal dialog is a
     * paper-action-dialog.
     *
     * @param image an object with parameters [thumbUri, imageUri,
     *   imageLicense, imageCredit], and optionally imageLinkUri
     */
    thumbnail = image.thumbUri;
    largeImg = image.imageUri;
    largeImgLink = typeof image.imageLinkUri === "function" ? image.imageLinkUri(image.imageUri) : void 0;
    imgLicense = image.imageLicense;
    imgCredit = image.imageCredit;
    html = "<div class=\"modal-img-container\">\n  <a href=\"" + largeImg + "\" class=\"" + classPrefix + "-img-anchor center-block text-center\">\n    <img src=\"" + thumbnail + "\"\n      data-href=\"" + largeImgLink + "\"\n      class=\"" + classPrefix + "-img-thumb\"\n      data-taxon=\"" + taxonQueryString + "\" />\n  </a>\n  <p class=\"small text-muted text-center\">\n    Image by " + imgCredit + " under " + imgLicense + "\n  </p>\n</div>";
    d$("#meta-taxon-info").before(html);
    try {
      lightboxImages("." + classPrefix + "-img-anchor", true);
    } catch (_error) {
      e = _error;
      console.error("Error lightboxing images");
    }
    if (typeof callback === "function") {
      callback();
    }
    return false;
  };
  taxonArray = [taxon.genus, taxon.species];
  if (taxon.subspecies != null) {
    taxonArray.push(taxon.subspecies);
  }
  taxonString = taxonArray.join("+");
  if (imageObject.imageUri != null) {
    if (typeof imageObject === "string") {
      imageUrl = imageObject;
      imageObject = new Object();
      imageObject.imageUri = imageUrl;
    }
    imgArray = imageObject.imageUri.split(".");
    extension = imgArray.pop();
    imgPath = imgArray.join(".");
    imageObject.thumbUri = "" + uri.urlString + imgPath + "-thumb." + extension;
    imageObject.imageUri = "" + uri.urlString + imgPath + "." + extension;
    insertImage(imageObject, taxonString, "ssarimg");
    return false;
  }

  /*
   * OK, we don't have it, do CalPhotos
   *
   * Hit targets of form
   * http://calphotos.berkeley.edu/cgi-bin/img_query?getthumbinfo=1&num=all&taxon=Acris+crepitans&format=xml
   *
   * See
   * http://calphotos.berkeley.edu/thumblink.html
   * for API reference.
   */
  args = "getthumbinfo=1&num=all&cconly=1&taxon=" + taxonString + "&format=xml";
  doneCORS = function(resultXml) {
    var data, e, result;
    result = xmlToJSON.parseString(resultXml);
    window.testData = result;
    data = result.calphotos[0];
    if (data == null) {
      console.warn("CalPhotos didn't return any valid images for this search!");
      return false;
    }
    imageObject = new Object();
    try {
      imageObject.thumbUri = data.thumb_url[0]["_text"];
      if (imageObject.thumbUri == null) {
        console.warn("CalPhotos didn't return any valid images for this search!");
        return false;
      }
      imageObject.imageUri = data.enlarge_jpeg_url[0]["_text"];
      imageObject.imageLinkUri = data.enlarge_url[0]["_text"];
      imageObject.imageLicense = data.license[0]["_text"];
      imageObject.imageCredit = "" + data.copyright[0]["_text"] + " (via CalPhotos)";
    } catch (_error) {
      e = _error;
      console.warn("CalPhotos didn't return any valid images for this search!", "" + ssar.affiliateQueryUrl.calPhotos + "?" + args);
      return false;
    }
    insertImage(imageObject, taxonString);
    return false;
  };
  failCORS = function(result, status) {
    console.error("Couldn't load a CalPhotos image to insert!");
    return false;
  };
  try {
    doCORSget(ssar.affiliateQueryUrl.calPhotos, args, doneCORS, failCORS);
  } catch (_error) {
    e = _error;
    console.error(e.message);
  }
  return false;
};

modalTaxon = function(taxon) {
  var html;
  if (taxon == null) {
    taxon = void 0;
  }

  /*
   * Pop up the modal taxon dialog for a given species
   */
  if (taxon == null) {
    $(".cndb-result-entry").click(function() {
      return modalTaxon($(this).attr("data-taxon"));
    });
    return false;
  }
  animateLoad();
  if (!$("#modal-taxon").exists()) {
    html = "<paper-action-dialog backdrop layered closeSelector=\"[affirmative]\" id='modal-taxon'>\n  <div id='modal-taxon-content'></div>\n  <paper-button dismissive id='modal-inat-linkout'>iNaturalist</paper-button>\n  <paper-button dismissive id='modal-calphotos-linkout' class=\"hidden-xs\">CalPhotos</paper-button>\n  <paper-button dismissive id='modal-alt-linkout' class=\"hidden-xs\"></paper-button>\n  <paper-button affirmative autofocus>Close</paper-button>\n</paper-action-dialog>";
    $("#result_container").after(html);
  }
  $.get(searchParams.targetApi, "q=" + taxon, "json").done(function(result) {
    var buttonText, commonType, data, deprecatedHtml, e, genusAuthBlock, humanTaxon, i, minorTypeHtml, notes, outboundLink, sn, speciesAuthBlock, taxonArray, taxonCreditDate, year, yearHtml, _ref;
    data = result.result[0];
    if (data == null) {
      toastStatusMessage("There was an error fetching the entry details. Please try again later.");
      stopLoadError();
      return false;
    }
    year = parseTaxonYear(data.authority_year);
    yearHtml = "";
    if (year !== false) {
      genusAuthBlock = "<span class='genus_authority authority'>" + data.genus_authority + "</span> " + year.genus;
      speciesAuthBlock = "<span class='species_authority authority'>" + data.species_authority + "</span> " + year.species;
      if (toInt(data.parens_auth_genus).toBool()) {
        genusAuthBlock = "(" + genusAuthBlock + ")";
      }
      if (toInt(data.parens_auth_species).toBool()) {
        speciesAuthBlock = "(" + speciesAuthBlock + ")";
      }
      yearHtml = "<div id=\"is-alien-container\" class=\"tooltip-container\"></div>\n<div id='near-me-container' data-toggle='tooltip' data-placement='top' title='' class='near-me tooltip-container'></div>\n<p>\n  <span class='genus'>" + data.genus + "</span>,\n  " + genusAuthBlock + ";\n  <span class='species'>" + data.species + "</span>,\n  " + speciesAuthBlock + "\n</p>";
    }
    deprecatedHtml = "";
    if (!isNull(data.deprecated_scientific)) {
      deprecatedHtml = "<p>Deprecated names: ";
      try {
        sn = JSON.parse(data.deprecated_scientific);
        i = 0;
        $.each(sn, function(scientific, authority) {
          i++;
          if (i !== 1) {
            deprecatedHtml += "; ";
          }
          deprecatedHtml += "<span class='sciname'>" + scientific + "</span>, " + authority;
          if (i === Object.size(sn)) {
            return deprecatedHtml += "</p>";
          }
        });
      } catch (_error) {
        e = _error;
        deprecatedHtml = "";
        console.error("There were deprecated scientific names, but the JSON was malformed.");
      }
    }
    minorTypeHtml = "";
    if (!isNull(data.minor_type)) {
      minorTypeHtml = " <core-icon icon='arrow-forward'></core-icon> <span id='taxon-minor-type'>" + data.minor_type + "</span>";
    }
    if (isNull(data.notes)) {
      data.notes = "Sorry, we have no notes on this taxon yet.";
      data.taxon_credit = "";
    } else {
      if (isNull(data.taxon_credit) || data.taxon_credit === "null") {
        data.taxon_credit = "This taxon information is uncredited.";
      } else {
        taxonCreditDate = isNull(data.taxon_credit_date) || data.taxon_credit_date === "null" ? "" : " (" + data.taxon_credit_date + ")";
        data.taxon_credit = "Taxon information by " + data.taxon_credit + "." + taxonCreditDate;
      }
    }
    try {
      notes = markdown.toHTML(data.notes);
    } catch (_error) {
      e = _error;
      notes = data.notes;
      console.warn("Couldn't parse markdown!! " + e.message);
    }
    commonType = !isNull(data.major_common_type) ? " (<span id='taxon-common-type'>" + data.major_common_type + "</span>) " : "";
    html = "<div id='meta-taxon-info'>\n  " + yearHtml + "\n  <p>\n    English name: <span id='taxon-common-name' class='common_name'>" + data.common_name + "</span>\n  </p>\n  <p>\n    Type: <span id='taxon-type' class=\"major_type\">" + data.major_type + "</span>\n    " + commonType + "\n    <core-icon icon='arrow-forward'></core-icon>\n    <span id='taxon-subtype' class=\"major_subtype\">" + data.major_subtype + "</span>" + minorTypeHtml + "\n  </p>\n  " + deprecatedHtml + "\n</div>\n<h3>Taxon Notes</h3>\n<p id='taxon-notes'>" + notes + "</p>\n<p class=\"text-right small text-muted\">" + data.taxon_credit + "</p>";
    $("#modal-taxon-content").html(html);
    $("#modal-inat-linkout").unbind().click(function() {
      return openTab("" + ssar.affiliateQueryUrl.iNaturalist + "?q=" + taxon);
    });
    $("#modal-calphotos-linkout").unbind().click(function() {
      return openTab("" + ssar.affiliateQueryUrl.calPhotos + "?rel-taxon=contains&where-taxon=" + taxon);
    });
    outboundLink = null;
    buttonText = null;
    if ((_ref = data.linnean_order.toLowerCase()) === "caudata" || _ref === "anura" || _ref === "gymnophiona") {
      buttonText = "AmphibiaWeb";
      outboundLink = "" + ssar.affiliateQueryUrl.amphibiaWeb + "?where-genus=" + data.genus + "&where-species=" + data.species;
    } else if (!isNull(data.linnean_order)) {
      buttonText = "Reptile Database";
      outboundLink = "" + ssar.affiliateQueryUrl.reptileDatabase + "?genus=" + data.genus + "&species=" + data.species;
    }
    if (outboundLink != null) {
      $("#modal-alt-linkout").removeClass("hidden").text(buttonText).unbind().click(function() {
        return openTab(outboundLink);
      });
    } else {
      $("#modal-alt-linkout").addClass("hidden").unbind();
    }
    formatScientificNames();
    doFontExceptions();
    humanTaxon = taxon.charAt(0).toUpperCase() + taxon.slice(1);
    humanTaxon = humanTaxon.replace(/\+/g, " ");
    $("#modal-taxon").attr("heading", humanTaxon);
    taxonArray = taxon.split("+");
    ssar.activeTaxon = {
      genus: taxonArray[0],
      species: taxonArray[1],
      subspecies: taxonArray[2]
    };
    if (isNull(data.image)) {
      data.image = void 0;
    }
    ssar.taxonImage = {
      imageUri: data.image,
      imageCredit: data.image_credit,
      imageLicense: data.image_license
    };
    insertModalImage();
    return checkTaxonNear(taxon, function() {
      formatAlien(data);
      stopLoad();
      return $("#modal-taxon")[0].open();
    });
  }).fail(function(result, status) {
    return stopLoadError();
  });
  return false;
};

doFontExceptions = function() {

  /*
   * Look for certain keywords to force into capitalized, or force
   * uncapitalized, overriding display CSS rules
   */
  var alwaysLowerCase, forceSpecialToLower;
  alwaysLowerCase = ["de", "and"];
  forceSpecialToLower = function(authorityText) {
    $.each(alwaysLowerCase, function(i, word) {
      var search;
      search = " " + word + " ";
      if (authorityText != null) {
        return authorityText = authorityText.replace(search, " <span class='force-lower'>" + word + "</span> ");
      }
    });
    return authorityText;
  };
  d$(".authority").each(function() {
    var authorityText;
    authorityText = $(this).text();
    if (!isNull(authorityText)) {
      return $(this).html(forceSpecialToLower(authorityText));
    }
  });
  return false;
};

sortResults = function(by_column) {
  var data;
  return data = searchParams.result;
};

setHistory = function(url, state, title) {
  if (url == null) {
    url = "#";
  }
  if (state == null) {
    state = null;
  }
  if (title == null) {
    title = null;
  }

  /*
   * Set up the history to provide something linkable
   */
  history.pushState(state, title, url);
  uri.query = $.url(url).attr("fragment");
  return false;
};

clearSearch = function(partialReset) {
  var calloutHtml;
  if (partialReset == null) {
    partialReset = false;
  }

  /*
   * Clear out the search and reset it to a "fresh" state.
   */
  $("#result-count").text("");
  calloutHtml = "<div class=\"bs-callout bs-callout-info center-block col-xs-12 col-sm-8 col-md-5\">\n  Search for a common or scientific name above to begin, eg, \"California slender salamander\" or \"<span class=\"sciname\">Batrachoseps attenuatus</span>\"\n</div>";
  $("#result_container").html(calloutHtml);
  if (partialReset === true) {
    return false;
  }
  setHistory();
  $(".cndb-filter").attr("value", "");
  $("#collapse-advanced").collapse('hide');
  $("#search").attr("value", "");
  $("#linnean-order").polymerSelected("any");
  formatScientificNames();
  return false;
};

downloadCSVList = function() {

  /*
   * Download a CSV file list
   *
   * See
   * https://github.com/tigerhawkvok/SSAR-species-database/issues/39
   */
  var args, d, dateString, day, filterArg, month;
  animateLoad();
  filterArg = "eyJpc19hbGllbiI6MCwiYm9vbGVhbl90eXBlIjoib3IifQ";
  args = "filter=" + filterArg;
  d = new Date();
  month = d.getMonth().toString().length === 1 ? "0" + (d.getMonth() + 1) : d.getMonth() + 1;
  day = d.getDate().toString().length === 1 ? "0" + (d.getDate().toString()) : d.getDate();
  dateString = "" + (d.getUTCFullYear()) + "-" + month + "-" + day;
  $.get("" + searchParams.apiPath, args, "json").done(function(result) {
    var authorityYears, col, colData, csv, csvBody, csvHeader, csvLiteralRow, csvRow, dirtyCol, dirtyColData, downloadable, e, genusYear, html, i, k, makeTitleCase, row, showColumn, speciesYear, tempCol, v, _ref;
    try {
      if (result.status !== true) {
        throw Error("Invalid Result");
      }
      csvBody = "";
      csvHeader = new Array();
      showColumn = ["genus", "species", "subspecies", "common_name", "image", "image_credit", "image_license", "major_type", "major_common_type", "major_subtype", "minor_type", "linnean_order", "genus_authority", "species_authority", "deprecated_scientific", "notes", "taxon_author", "taxon_credit", "taxon_credit_date"];
      makeTitleCase = ["genus", "common_name", "taxon_author", "major_subtype", "linnean_order"];
      i = 0;
      _ref = result.result;
      for (k in _ref) {
        row = _ref[k];
        csvRow = new Array();
        if (isNull(row.genus)) {
          continue;
        }
        for (dirtyCol in row) {
          dirtyColData = row[dirtyCol];
          col = dirtyCol.replace(/"/g, '""');
          colData = dirtyColData.replace(/"/g, '""').replace(/&#39;/g, "'");
          if (i === 0) {
            if (__indexOf.call(showColumn, col) >= 0) {
              csvHeader.push(col.replace(/_/g, " ").toTitleCase());
            }
          }
          if (__indexOf.call(showColumn, col) >= 0) {
            if (/[a-z]+_authority/.test(col)) {
              try {
                authorityYears = JSON.parse(row.authority_year);
                genusYear = "";
                speciesYear = "";
                for (k in authorityYears) {
                  v = authorityYears[k];
                  genusYear = k.replace(/&#39;/g, "'");
                  speciesYear = v.replace(/&#39;/g, "'");
                }
                switch (col.split("_")[0]) {
                  case "genus":
                    tempCol = "" + (colData.toTitleCase()) + " " + genusYear;
                    if (toInt(row.parens_auth_genus).toBool()) {
                      tempCol = "(" + tempCol + ")";
                    }
                    break;
                  case "species":
                    tempCol = "" + (colData.toTitleCase()) + " " + speciesYear;
                    if (toInt(row.parens_auth_species).toBool()) {
                      tempCol = "(" + tempCol + ")";
                    }
                }
                colData = tempCol;
              } catch (_error) {
                e = _error;
              }
            }
            if (__indexOf.call(makeTitleCase, col) >= 0) {
              colData = colData.toTitleCase();
            }
            if (col === "image" && !isNull(colData)) {
              colData = "http://ssarherps.org/cndb/" + colData;
            }
            csvRow.push("\"" + colData + "\"");
          }
        }
        i++;
        csvLiteralRow = csvRow.join(",");
        csvBody += "\n" + csvLiteralRow;
      }
      csv = "" + (csvHeader.join(",")) + "\n" + csvBody;
      downloadable = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
      html = "<paper-action-dialog class=\"download-file\" id=\"download-csv-file\" heading=\"Your file is ready\">\n  <div class=\"dialog-content\">\n    <p>\n      Please note that some special characters in names may be decoded incorrectly by Microsoft Excel. If this is a problem, following the steps in <a href=\"https://github.com/SSARHERPS/SSAR-species-database/blob/master/meta/excel_unicode_readme.md\"  onclick='window.open(this.href); return false;' onkeypress='window.open(this.href); return false;'>this README <core-icon icon=\"launch\"></core-icon></a> to force Excel to format it correctly.\n    </p>\n    <p class=\"text-center\">\n      <a href=\"" + downloadable + "\" download=\"ssar-common-names-" + dateString + ".csv\" class=\"btn btn-default\"><core-icon icon=\"file-download\"></core-icon> Download Now</a>\n    </p>\n  </div>\n  <paper-button dismissive>Close</paper-button>\n</paper-action-dialog>";
      if (!$("#download-csv-file").exists()) {
        $("body").append(html);
      } else {
        $("#download-csv-file").replaceWith(html);
      }
      $("#download-csv-file").get(0).open();
      return stopLoad();
    } catch (_error) {
      e = _error;
      stopLoadError("There was a problem creating the CSV file. Please try again later.");
      console.error("Exception in downloadCSVList() - " + e.message);
      return console.warn("Got", result, "from", "" + searchParams.apiPath + "?filter=" + filterArg, result.status);
    }
  }).fail(function() {
    return stopLoadError("There was a problem communicating with the server. Please try again later.");
  });
  return false;
};

downloadHTMLList = function() {

  /*
   * Download a HTML file list
   *
   * See
   * https://github.com/tigerhawkvok/SSAR-species-database/issues/40
   */
  foo();
  return false;
};

insertCORSWorkaround = function() {
  var browserExtensionLink, browsers, e, html;
  if (ssar.hasShownWorkaround == null) {
    ssar.hasShownWorkaround = false;
  }
  if (ssar.hasShownWorkaround) {
    return false;
  }
  try {
    browsers = new WhichBrowser();
  } catch (_error) {
    e = _error;
    return false;
  }
  if (browsers.isType("mobile")) {
    ssar.hasShownWorkaround = true;
    return false;
  }
  browserExtensionLink = (function() {
    switch (browsers.browser.name) {
      case "Chrome":
        return "Install the extension \"<a class='alert-link' href='https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi?utm_source=chrome-app-launcher-info-dialog'>Allow-Control-Allow-Origin: *</a>\", activate it on this domain, and you'll see them in your popups!";
      case "Firefox":
        return "Follow the instructions <a class='alert-link' href='http://www-jo.se/f.pfleger/forcecors-workaround'>for this ForceCORS add-on</a>, or try Chrome for a simpler extension. Once you've done so, you'll see photos in your popups!";
      case "Internet Explorer":
        return "Follow these <a class='alert-link' href='http://stackoverflow.com/a/20947828'>StackOverflow instructions</a> while on this site, and you'll see them in your popups!";
      default:
        return "";
    }
  })();
  html = "<div class=\"alert alert-info alert-dismissible center-block fade in\" role=\"alert\">\n  <button type=\"button\" class=\"close\" data-dismiss=\"alert\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button>\n  <strong>Want CalPhotos images in your species dialogs?</strong> " + browserExtensionLink + "\n  We're working with CalPhotos to enable this natively, but it's a server change on their side.\n</div>";
  $("#result_container").before(html);
  $(".alert").alert();
  ssar.hasShownWorkaround = true;
  return false;
};

showBadSearchErrorMessage = function(result) {
  var filterText, i, sOrig, text;
  sOrig = result.query.replace(/\+/g, " ");
  if (result.status === true) {
    if (result.query_params.filter.had_filter === true) {
      filterText = "";
      i = 0;
      $.each(result.query_params.filter.filter_params, function(col, val) {
        if (col !== "BOOLEAN_TYPE") {
          if (i !== 0) {
            filterText = "" + filter_text + " " + result.filter.filter_params.BOOLEAN_TYPE;
          }
          if (isNumber(toInt(val, true))) {
            val = toInt(val) === 1 ? "true" : "false";
          }
          return filterText = "" + filterText + " " + (col.replace(/_/g, " ")) + " is " + val;
        }
      });
      text = "\"" + sOrig + "\" where " + filterText + " returned no results.";
    } else {
      text = "\"" + sOrig + "\" returned no results.";
    }
  } else {
    text = result.human_error;
  }
  return stopLoadError(text);
};

$(function() {
  var devHello, e, f64, filterObj, fuzzyState, loadArgs, looseState, openFilters, queryUrl, temp;
  devHello = "****************************************************************************\nHello developer!\nIf you're looking for hints on our API information, this site is open-source\nand released under the GPL. Just click on the GitHub link on the bottom of\nthe page, or check out https://github.com/SSARHERPS\n****************************************************************************";
  console.log(devHello);
  animateLoad();
  window.addEventListener("popstate", function(e) {
    var loadArgs, temp;
    uri.query = $.url().attr("fragment");
    try {
      loadArgs = Base64.decode(uri.query);
    } catch (_error) {
      e = _error;
      loadArgs = "";
    }
    console.log("Popping state to " + loadArgs);
    performSearch(loadArgs);
    temp = loadArgs.split("&")[0];
    return $("#search").attr("value", temp);
  });
  $("#do-reset-search").click(function() {
    return clearSearch();
  });
  $("#search_form").submit(function(e) {
    e.preventDefault();
    return performSearch();
  });
  $("#collapse-advanced").on("shown.bs.collapse", function() {
    return $("#collapse-icon").attr("icon", "unfold-less");
  });
  $("#collapse-advanced").on("hidden.bs.collapse", function() {
    return $("#collapse-icon").attr("icon", "unfold-more");
  });
  $("#search_form").keypress(function(e) {
    if (e.which === 13) {
      return performSearch();
    }
  });
  $("#do-search").click(function() {
    return performSearch();
  });
  $("#do-search-all").click(function() {
    return performSearch(true);
  });
  $("#linnean-order").on("core-select", function() {
    if (!isNull($("#search").val())) {
      return performSearch();
    }
  });
  if (isNull(uri.query)) {
    loadArgs = "";
  } else {
    try {
      loadArgs = Base64.decode(uri.query);
      queryUrl = $.url("" + searchParams.apiPath + "?q=" + loadArgs);
      try {
        looseState = queryUrl.param("loose").toBool();
      } catch (_error) {
        e = _error;
        looseState = false;
      }
      try {
        fuzzyState = queryUrl.param("fuzzy").toBool();
      } catch (_error) {
        e = _error;
        fuzzyState = false;
      }
      $("#loose").prop("checked", looseState);
      $("#fuzzy").prop("checked", fuzzyState);
      temp = loadArgs.split("&")[0];
      temp = temp.replace(/\+/g, " ").trim();
      $("#search").attr("value", temp);
      try {
        f64 = queryUrl.param("filter");
        filterObj = JSON.parse(Base64.decode(f64));
        openFilters = false;
        $.each(filterObj, function(col, val) {
          var selectedState, selector;
          col = col.replace(/_/g, "-");
          selector = "#" + col + "-filter";
          if (col !== "type") {
            if (col !== "is-alien") {
              $(selector).attr("value", val);
            } else {
              selectedState = toInt(val) === 1 ? "alien-only" : "native-only";
              console.log("Setting alien-filter to " + selectedState);
              $("#alien-filter").get(0).selected = selectedState;
              delay(750, function() {
                return $("#alien-filter").get(0).selected = selectedState;
              });
            }
            return openFilters = true;
          } else {
            return $("#linnean-order").polymerSelected(val);
          }
        });
        if (openFilters) {
          $("#collapse-advanced").collapse("show");
        }
      } catch (_error) {
        e = _error;
        f64 = false;
      }
    } catch (_error) {
      e = _error;
      console.error("Bad argument " + uri.query + " => " + loadArgs + ", looseState, fuzzyState", looseState, fuzzyState, "" + searchParams.apiPath + "?q=" + loadArgs);
      console.warn(e.message);
      loadArgs = "";
    }
  }
  if (!isNull(loadArgs) && loadArgs !== "#") {
    return $.get(searchParams.targetApi, "q=" + loadArgs, "json").done(function(result) {
      if (result.status === true && result.count > 0) {
        formatSearchResults(result);
        return false;
      }
      showBadSearchErrorMessage(result);
      console.error(result.error);
      return console.warn(result);
    }).fail(function(result, error) {
      console.error("There was an error loading the generic table");
      console.warn(result, error, result.statusText);
      error = "" + result.status + " - " + result.statusText;
      $("#search-status").attr("text", "Couldn't load table - " + error);
      $("#search-status")[0].show();
      return stopLoadError();
    }).always(function() {
      $("#search").attr("disabled", false);
      return false;
    });
  } else {
    stopLoad();
    $("#search").attr("disabled", false);
    return $("#loose").prop("checked", true);
  }
});

//# sourceMappingURL=maps/c.js.map
