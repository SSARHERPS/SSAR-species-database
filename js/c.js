
/*
 * The main coffeescript file for administrative stuff
 */
var activityIndicatorOff, activityIndicatorOn, adminParams, animateLoad, byteCount, deferCalPhotos, delay, formatScientificNames, formatSearchResults, goTo, isBlank, isBool, isEmpty, isJson, isNull, isNumber, lightboxImages, loadAdminUi, mapNewWindows, modalTaxon, openLink, openTab, overlayOff, overlayOn, parseTaxonYear, performSearch, prepURI, randomInt, root, roundNumber, searchParams, setHistory, sortResults, stopLoad, stopLoadError, toFloat, toInt, toastStatusMessage, uri,
  __slice = [].slice;

adminParams = new Object();

adminParams.loginPage = "admin-login.php";

adminParams.apiTarget = "admin_api.php";

loadAdminUi = function() {

  /*
   * Main wrapper function. Checks for a valid login state, then
   * fetches/draws the page contents if it's OK. Otherwise, boots the
   * user back to the login page.
   */
  return false;
};

$(function() {
  if (window.loadAdminUi === true) {
    return loadAdminUi();
  }
});

root = typeof exports !== "undefined" && exports !== null ? exports : this;

uri = new Object();

uri.o = $.url();

uri.urlString = uri.o.attr('protocol') + '://' + uri.o.attr('host') + uri.o.attr("directory");

uri.query = uri.o.attr("fragment");

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

Number.prototype.toBool = function() {
  return this === 1;
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
  var childDropdown, e, prop, val;
  if (setSelected == null) {
    setSelected = void 0;
  }
  if (setSelected != null) {
    try {
      jQuery(this).prop("selected", setSelected);
      jQuery(this).prop("active", setSelected);
      if (setSelected === true) {
        return jQuery(this).addClass("core-selected");
      } else {
        return jQuery(this).removeClass("core-selected");
      }
    } catch (_error) {
      e = _error;
      return false;
    }
  } else {
    val = void 0;
    try {
      childDropdown = $(this).find("[valueattr]");
      if (isNull(childDropdown)) {
        childDropdown = $(this);
      }
      prop = childDropdown.attr("valueattr");
      console.log("Looking at  prop " + prop);
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

mapNewWindows = function() {
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
    $(this).click(function() {
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
    className = "error";
  }
  if (duration == null) {
    duration = 3000;
  }
  if (selector == null) {
    selector = "#status-message";
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

animateLoad = function(d, elId) {
  var e, selector;
  if (d == null) {
    d = 50;
  }
  if (elId == null) {
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
    return console.log('Could not animate loader', e.message);
  }
};

stopLoad = function(elId) {
  var e, selector;
  if (elId == null) {
    elId = "loader";
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
      return delay(1000, function() {
        $(selector).removeClass("good");
        return $(selector).attr("active", false);
      });
    }
  } catch (_error) {
    e = _error;
    return console.log('Could not stop load animation', e.message);
  }
};

stopLoadError = function(elId) {
  var e, selector;
  if (elId == null) {
    elId = "loader";
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
      return delay(3000, function() {
        $(selector).removeClass("bad");
        return $(selector).attr("active", false);
      });
    }
  } catch (_error) {
    e = _error;
    return console.log('Could not stop load error animation', e.message);
  }
};

lightboxImages = function(selector) {
  var options;
  if (selector == null) {
    selector = ".lightboximage";
  }
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
    allowedTypes: 'png|jpg|jpeg|gif'
  };

  /*
  $(selector).has("img").each ->
    if not $(this).attr("nolightbox")?
      $(this).imageLightbox(options)
   */
  return $(selector).imageLightbox(options);
};

activityIndicatorOn = function() {
  return $('<div id="imagelightbox-loading"><div></div></div>').appendTo('body');
};

activityIndicatorOff = function() {
  return $('#imagelightbox-loading').remove();
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

$(function() {
  $(".click").click(function() {
    return openTab($(this).attr("data-url"));
  });
  return $('[data-toggle="tooltip"]').tooltip();
});

searchParams = new Object();

searchParams.targetApi = "commonnames_api.php";

searchParams.targetContainer = "#result_container";

searchParams.apiPath = uri.urlString + searchParams.targetApi;

performSearch = function(stateArgs) {
  var args, s, sOrig;
  if (stateArgs == null) {
    stateArgs = void 0;
  }
  if (stateArgs == null) {
    s = $("#search").val();
    sOrig = s;
    s = s.toLowerCase();
    if (isNull(s)) {
      $("#search-status").attr("text", "Please enter a search term.");
      $("#search-status")[0].show();
      return false;
    }
    s = prepURI(s);
    if ($("#loose").polymerChecked()) {
      s = "" + s + "&loose=true";
    }
    if ($("#fuzzy").polymerChecked()) {
      s = "" + s + "&fuzzy=true";
    }
    args = "q=" + s;
  } else {
    args = "q=" + stateArgs;
    sOrig = stateArgs.split("&")[0];
  }
  animateLoad();
  console.log("Got search value " + s + ", hitting", "" + searchParams.apiPath + "?" + args);
  return $.get(searchParams.targetApi, args, "json").done(function(result) {
    console.log("Search executed by " + result.method + " with " + result.count + " results.");
    if (toInt(result.count) === 0) {
      $("#search-status").attr("text", "\"" + sOrig + "\" returned no results.");
      $("#search-status")[0].show();
      stopLoadError();
      return false;
    }
    if (result.status === true) {
      formatSearchResults(result);
      return false;
    }
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

formatSearchResults = function(result, container) {
  var bootstrapColCount, colClass, data, headers, html, htmlClose, htmlHead, targetCount;
  if (container == null) {
    container = searchParams.targetContainer;
  }
  data = result.result;
  searchParams.result = data;
  headers = new Array();
  html = "";
  htmlHead = "<table id='cndb-result-list' class='table table-striped table-hover'>\n\t<tr class='cndb-row-headers'>";
  htmlClose = "</table>";
  targetCount = toInt(result.count) - 1;
  colClass = null;
  bootstrapColCount = 0;
  return $.each(data, function(i, row) {
    var htmlRow, j, l, taxonQuery;
    if (toInt(i) === 0) {
      j = 0;
      htmlHead += "\n<!-- Table Headers - " + (Object.size(row)) + " entries -->";
      $.each(row, function(k, v) {
        var alt, bootstrapColSize, niceKey;
        niceKey = k.replace(/_/g, " ");
        if (k !== "id" && k !== "minor_type" && k !== "notes") {
          if ($("#show-deprecated").polymerSelected() !== true) {
            alt = "deprecated_scientific";
          } else {
            alt = "";
          }
          if (k !== alt) {
            htmlHead += "\n\t\t<th class='text-center'>" + niceKey + "</th>";
            bootstrapColCount++;
          }
        }
        j++;
        if (j === Object.size(row)) {
          htmlHead += "\n\t</tr>";
          htmlHead += "\n<!-- End Table Headers -->";
          console.log("Got " + bootstrapColCount + " display columns.");
          bootstrapColSize = roundNumber(12 / bootstrapColCount, 0);
          return colClass = "col-md-" + bootstrapColSize;
        }
      });
    }
    taxonQuery = "" + row.genus + "+" + row.species;
    if (!isNull(row.subspecies)) {
      taxonQuery = "" + taxonQuery + "+" + row.subspecies;
    }
    htmlRow = "\n\t<tr id='cndb-row" + i + "' class='cndb-result-entry' data-taxon=\"" + taxonQuery + "\">";
    l = 0;
    $.each(row, function(k, col) {
      var alt, d, e, genus, kClass, species, split, year;
      if (k !== "id" && k !== "minor_type" && k !== "notes") {
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
              col = "<paper-icon-button icon='launch' data-href='http://calphotos.berkeley.edu/cgi/img_query?rel-taxon=contains&where-taxon=" + taxonQuery + "' class='newwindow calphoto' data-taxon=\"" + taxonQuery + "\"></paper-icon-button>";
            } else {
              col = "<paper-icon-button icon='image:image' data-lightbox='" + col + "' class='lightboximage'></paper-icon-button>";
            }
          }
          if (k !== "genus" && k !== "species" && k !== "subspecies") {
            kClass = "" + k + " text-center";
          } else {
            kClass = k;
          }
          htmlRow += "\n\t\t<td id='" + k + "-" + i + "' class='" + kClass + " " + colClass + "'>" + col + "</td>";
        }
      }
      l++;
      if (l === Object.size(row)) {
        htmlRow += "\n\t</tr>";
        return html += htmlRow;
      }
    });
    if (toInt(i) === targetCount) {
      html = htmlHead + html + htmlClose;
      console.log("Processed " + (toInt(i) + 1) + " rows");
      $(container).html(html);
      mapNewWindows();
      lightboxImages();
      modalTaxon();
      $("#result-count").text(" - " + result.count + " entries");
      return stopLoad();
    }
  });
};

parseTaxonYear = function(taxonYearString, strict) {
  var d, e, genus, species, split, year;
  if (strict == null) {
    strict = true;
  }
  try {
    d = JSON.parse(taxonYearString);
  } catch (_error) {
    e = _error;
    console.warn("There was an error parsing '" + taxonYearString + "', attempting to fix - ", e.message);
    split = taxonYearString.split(":");
    year = split[1].slice(split[1].search("\"") + 1, -2);
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

deferCalPhotos = function(selector) {
  var count, cpUrl, i;
  if (selector == null) {
    selector = ".calphoto";
  }

  /*
   * Defer renders of calphoto linkouts
   * Hit targets of form
   * http://calphotos.berkeley.edu/cgi-bin/img_query?getthumbinfo=1&num=all&taxon=Acris+crepitans&format=xml
   */
  count = $(selector).length;
  cpUrl = "http://calphotos.berkeley.edu/cgi-bin/img_query";
  i = 0;
  $(selector).each(function() {
    var args, taxon, thisLinkout;
    i++;
    thisLinkout = $(this);
    taxon = thisLinkout.attr("data-taxon");
    args = "getthumbinfo=1&num=all&cconly=1&taxon=" + taxon + "&format=xml";
    return $.get(cpUrl, args).done(function(resultXml) {
      var data, html, large, link, result, thumb;
      result = xmlToJSON.parseString(resultXml);
      data = result.xml.calphotos;
      thumb = data.thumb_url;
      large = data.enlarge_jpeg_url;
      link = data.enlarge_url;
      html = "<a href='" + large + "' class='calphoto-img-anchor'><img src='" + thumb + "' data-href='" + link + "' class='calphoto-img-thumb' data-taxon='" + taxon + "'/></a>";
      thisLinkout.replaceWith(html);
      return false;
    }).fail(function(result, status) {
      return false;
    }).always(function() {
      if (i === count) {
        return lightboxImages(".calphoto-image-anchor");
      }
    });
  });
  return false;
};

modalTaxon = function(taxon) {
  var html;
  if (taxon == null) {
    taxon = void 0;
  }
  if (taxon == null) {
    $(".cndb-result-entry").click(function() {
      return modalTaxon($(this).attr("data-taxon"));
    });
    return false;
  }
  animateLoad();
  if (!$("#modal-taxon").exists()) {
    html = "<paper-action-dialog backdrop layered closeSelector=\"[affirmative]\" id='modal-taxon'><div id='modal-taxon-content'></div><paper-button dismissive id='modal-inat-linkout'>iNaturalist</paper-button><paper-button dismissive id='modal-calphotos-linkout'>CalPhotos</paper-button><paper-button affirmative autofocus>Close</paper-button></paper-action-dialog>";
    $("#result_container").after(html);
  }
  $.get(searchParams.targetApi, "q=" + taxon, "json").done(function(result) {
    var data, deprecatedHtml, e, humanTaxon, i, minorTypeHtml, sn, year, yearHtml;
    data = result.result[0];
    console.log("Got", data);
    year = parseTaxonYear(data.authority_year);
    yearHtml = "";
    if (year !== false) {
      yearHtml = "<p><span class='genus'>" + data.genus + "</span>, <span class='genus_authority'>" + data.genus_authority + "</span> " + year.genus + "; <span class='species'>" + data.species + "</span>, <span class='species_authority'>" + data.species_authority + "</span> " + year.species + "</p>";
    }
    deprecatedHtml = "";
    if (!isNull(data.deprecated_scientific)) {
      deprecatedHtml = "<p>Deprecated names:";
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
    }
    html = "<div id='meta-taxon-info'>" + yearHtml + "<p>Common name: <span id='taxon-common-name' class='common-name'>" + data.common_name + "</span></p><p>Type: <span id='taxon-type'>" + data.major_type + "</span> (<span id='taxon-common-type'>" + data.major_common_type + "</span>) <core-icon icon='arrow-forward'></core-icon> <span id='taxon-subtype'>" + data.major_subtype + "</span>" + minorTypeHtml + "</p>" + deprecatedHtml + "</div><h3>Taxon Notes</h3><p id='taxon-notes'>" + data.notes + "</p>";
    $("#modal-taxon-content").html(html);
    $("#modal-inat-linkout").unbind().click(function() {
      return openTab("http://www.inaturalist.org/taxa/search?q=" + taxon);
    });
    $("#modal-calphotos-linkout").unbind().click(function() {
      return openTab("http://calphotos.berkeley.edu/cgi/img_query?rel-taxon=contains&where-taxon=" + taxon);
    });
    formatScientificNames();
    humanTaxon = taxon.charAt(0).toUpperCase() + taxon.slice(1);
    humanTaxon = humanTaxon.replace(/\+/g, " ");
    $("#modal-taxon").attr("heading", humanTaxon);
    stopLoad();
    return $("#modal-taxon")[0].open();
  }).fail(function(result, status) {
    return stopLoadError();
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

$(function() {
  var e, fuzzyState, loadArgs, looseState, queryUrl;
  console.log("Doing onloads ...");
  animateLoad();
  window.addEventListener("popstate", function(e) {
    uri.query = $.url().attr("fragment");
    console.log("Popping state to " + uri.query);
    return performSearch(uri.query);
  });
  $("#search_form").submit(function(e) {
    e.preventDefault();
    return performSearch();
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
    return performSearch("");
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
    } catch (_error) {
      e = _error;
      console.error("Bad argument " + uri.query + " => " + loadArgs + ", looseState, fuzzyState", looseState, fuzzyState, "" + searchParams.apiPath + "?q=" + loadArgs);
      console.warn(e.message);
      loadArgs = "";
    }
  }
  if (!isNull(loadArgs) && loadArgs !== "#") {
    console.log("Doing initial search with '" + loadArgs + "', hitting", "" + searchParams.apiPath + "?q=" + loadArgs);
    return $.get(searchParams.targetApi, "q=" + loadArgs, "json").done(function(result) {
      if (result.status === true && result.count > 0) {
        console.log("Got a valid result, formatting " + result.count + " results.");
        formatSearchResults(result);
        return false;
      }
      if (result.count === 0) {
        result.human_error = "No results for \"" + (loadArgs.split("&")[0]) + "\"";
      }
      $("#search-status").attr("text", result.human_error);
      $("#search-status")[0].show();
      console.error(result.error);
      console.warn(result);
      return stopLoadError();
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

//# sourceMappingURL=../coffee/maps/c.js.map
