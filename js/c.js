var animateLoad, byteCount, delay, formatSearchResults, isBlank, isBool, isEmpty, isJson, isNull, isNumber, mapNewWindows, performSearch, root, roundNumber, searchParams, sortResults, stopLoad, stopLoadError, toFloat, toInt,
  __slice = [].slice;

root = typeof exports !== "undefined" && exports !== null ? exports : this;

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

toFloat = function(str) {
  if (!isNumber(str) || isNull(str)) {
    return 0;
  }
  return parseFloat(str);
};

toInt = function(str) {
  if (!isNumber(str) || isNull(str)) {
    return 0;
  }
  return parseInt(str);
};

function toObject(arr) {
    var rv = {};
    for (var i = 0; i < arr.length; ++i)
        if (arr[i] !== undefined) rv[i] = arr[i];
    return rv;
};

String.prototype.toBool = function() {
  return this.toString() === 'true';
};

Boolean.prototype.toBool = function() {
  return this.toString() === 'true';
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

byteCount = (function(_this) {
  return function(s) {
    return encodeURI(s).split(/%..|./).length - 1;
  };
})(this);

function shuffle(o) { //v1.0
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
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

mapNewWindows = function() {
  return $(".newwindow").each(function() {
    var curHref, openInNewWindow;
    curHref = $(this).attr("href");
    openInNewWindow = function(url) {
      if (url == null) {
        return false;
      }
      window.open(url);
      return false;
    };
    $(this).click(function() {
      return openInNewWindow(curHref);
    });
    return $(this).keypress(function() {
      return openInNewWindow(curHref);
    });
  });
};

animateLoad = function(d, elId) {
  var big, e, offset, offset2, sm_d, small;
  if (d == null) {
    d = 50;
  }
  if (elId == null) {
    elId = "#status-container";
  }
  try {
    if ($(elId).exists()) {
      sm_d = roundNumber(d * .5);
      big = $(elId).find('.ball');
      small = $(elId).find('.ball1');
      big.removeClass('stop hide');
      big.css({
        width: "" + d + "px",
        height: "" + d + "px"
      });
      offset = roundNumber(d / 2 + sm_d / 2 + 9);
      offset2 = roundNumber((d + 10) / 2 - (sm_d + 6) / 2);
      small.removeClass('stop hide');
      small.css({
        width: "" + sm_d + "px",
        height: "" + sm_d + "px",
        top: "-" + offset + "px",
        'margin-left': "" + offset2 + "px"
      });
      return true;
    }
    return false;
  } catch (_error) {
    e = _error;
    return console.log('Could not animate loader', e.message);
  }
};

stopLoad = function(elId) {
  var big, e, small;
  if (elId == null) {
    elId = "#status-container";
  }
  try {
    if ($(elId).exists()) {
      big = $(elId).find('.ball');
      small = $(elId).find('.ball1');
      big.addClass('bballgood ballgood');
      small.addClass('bballgood ball1good');
      return delay(250, function() {
        big.addClass('stop hide');
        big.removeClass('bballgood ballgood');
        small.addClass('stop hide');
        return small.removeClass('bballgood ball1good');
      });
    }
  } catch (_error) {
    e = _error;
    return console.log('Could not stop load animation', e.message);
  }
};

stopLoadError = function(elId) {
  var big, e, small;
  if (elId == null) {
    elId = "#status-container";
  }
  try {
    if ($(elId).exists()) {
      big = $(elId).find('.ball');
      small = $(elId).find('.ball1');
      big.addClass('bballerror ballerror');
      small.addClass('bballerror ball1error');
      return delay(1500, function() {
        big.addClass('stop hide');
        big.removeClass('bballerror ballerror');
        small.addClass('stop hide');
        return small.removeClass('bballerror ball1error');
      });
    }
  } catch (_error) {
    e = _error;
    return console.log('Could not stop load error animation', e.message);
  }
};

$(function() {
  var e;
  try {
    window.picturefill();
  } catch (_error) {
    e = _error;
    console.log("Could not execute picturefill.");
  }
  return mapNewWindows();
});

searchParams = new Object();

searchParams.targetApi = "cndb/commonnames_api.php";

searchParams.targetContainer = "#result_container";

performSearch = function() {
  var args, s;
  s = $("#search").val();
  if (isNull(s)) {
    $("#search-status").attr("text", "Please enter a search term.");
    $("#search-status")[0].show();
    return false;
  }
  console.log("Got search value " + s);
  args = "q=" + s;
  return $.post(searchParams.targetApi, args, "json").done(function(result) {
    console.log("Search executed by " + result.method + " with " + result.count + " results.");
    if (result.status === true) {
      formatSearchResults(result);
      return false;
    }
    $("#search-status").attr("text", result.human_error);
    $("#search-status")[0].show();
    console.error(result.error);
    return console.warn(result);
  }).fail(function(result, error) {
    console.error("There was an error performing the search");
    console.warn(result, error, result.statusText);
    error = "" + result.status + " - " + result.statusText;
    $("#search-status").attr("text", "Couldn't execute the search - " + error);
    return $("#search-status")[0].show();
  }).always(function() {
    return false;
  });
};

formatSearchResults = function(result, container) {
  var data, headers, html, htmlClose, htmlHead;
  if (container == null) {
    container = searchParams.targetContainer;
  }
  data = result.result;
  searchParams.result = data;
  headers = new Array();
  html = "";
  htmlHead = "<table>\n\t<tr>";
  htmlClose = "</table>";
  return $.each(data, function(i, row) {
    var htmlRow, j, l;
    if (i === 0) {
      j = 0;
      $.each(row, function(k, v) {
        htmlHead += "\n\t\t<th>" + k + "</th>";
        j++;
        if (j === Object.size(row)) {
          return htmlHead += "\n\t</tr>";
        }
      });
    }
    htmlRow = "\n\t<tr id='cndb-row" + i + "'>";
    l = 0;
    $.each(row, function(k, col) {
      htmlRow += "\n\t\t<td id='" + k + "-" + i + "'>" + col + "</td>";
      l++;
      if (l === Object.size(row)) {
        htmlRow += "\n\t</tr>";
        return html += htmlRow;
      }
    });
    if (i === Object.size(data)) {
      html = htmlHead + html + htmlClose;
      console.log("Processed " + i + " rows");
      return $(container).html(html);
    }
  });
};

sortResults = function(by_column) {
  var data;
  return data = searchParams.result;
};

$(function() {
  console.log("Doing onloads ...");
  $("#search_form").submit(function(e) {
    e.preventDefault();
    return performSearch();
  });
  $("#do-search").click(function() {
    return performSearch();
  });
  return $.post(searchParams.targetApi, "", "json").done(function(result) {
    if (result.status === true) {
      formatSearchResults(result);
      return false;
    }
    $("#search-status").attr("text", result.human_error);
    $("#search-status")[0].show();
    console.error(result.error);
    return console.warn(result);
  }).fail(function(result, error) {
    console.error("There was an error loading the generic table");
    console.warn(result, error, result.statusText);
    error = "" + result.status + " - " + result.statusText;
    $("#search-status").attr("text", "Couldn't load table - " + error);
    return $("#search-status")[0].show();
  }).always(function() {
    $("#search").attr("disabled", false);
    return false;
  });
});

//# sourceMappingURL=../coffee/maps/c.js.map
