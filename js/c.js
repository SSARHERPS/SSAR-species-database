
/*
 * The main coffeescript file for administrative stuff
 * Triggered from admin-page.html
 */
var activityIndicatorOff, activityIndicatorOn, adminParams, animateLoad, bindClickTargets, byteCount, checkTaxonNear, deferCalPhotos, delay, foo, formatScientificNames, formatSearchResults, getFilters, getLocation, goTo, handleDragDropImage, isBlank, isBool, isEmpty, isJson, isNull, isNumber, lightboxImages, loadAdminUi, lookupEditorSpecies, mapNewWindows, modalTaxon, openLink, openTab, overlayOff, overlayOn, parseTaxonYear, performSearch, prepURI, randomInt, renderAdminSearchResults, root, roundNumber, saveEditorEntry, searchParams, setHistory, sortResults, stopLoad, stopLoadError, toFloat, toInt, toastStatusMessage, uri, verifyLoginCredentials,
  __slice = [].slice;

adminParams = new Object();

adminParams.apiTarget = "admin_api.php";

adminParams.loginDir = "admin/";

adminParams.loginApiTarget = "" + adminParams.loginDir + "async_login_handler.php";

loadAdminUi = function() {

  /*
   * Main wrapper function. Checks for a valid login state, then
   * fetches/draws the page contents if it's OK. Otherwise, boots the
   * user back to the login page.
   */
  var e;
  try {
    verifyLoginCredentials(function(data) {
      var searchForm;
      $("article").html("<h3>Welcome, " + ($.cookie("ssarherps_name")) + " <paper-icon-button icon='settings-applications' class='click' data-url='" + data.login_url + "'></paper-icon-button></h3><div id='admin-actions-block'><div class='bs-callout bs-callout-info'><p>Please be patient while the administrative interface loads.</p></div></div>");

      /*
       * Render out the admin UI
       * We want a search box that we pipe through the API
       * and display the table out for editing
       */
      searchForm = "<form id=\"admin-search-form\" onsubmit=\"event.preventDefault()\">\n\t<div>\n\t\t<paper-input label=\"Search for species\" id=\"admin-search\" name=\"admin-search\" required autofocus floatingLabel class=\"col-xs-7 col-sm-8\"></paper-input>\n\t\t<paper-fab id=\"do-admin-search\" icon=\"search\" raisedButton class=\"materialblue\"></paper-fab>\n\t</div>\n</form><div id='search-results'></div>";
      $("#admin-actions-block").html(searchForm);
      $("#admin-search-form").submit(function(e) {
        return e.preventDefault();
      });
      $("#admin-search").keypress(function(e) {
        if (e.which === 13) {
          return renderAdminSearchResults();
        }
      });
      $("#do-admin-search").click(function() {
        return renderAdminSearchResults();
      });
      return false;
    });
  } catch (_error) {
    e = _error;
    $("article").html("<div class='bs-callout bs-callout-danger'><h4>Application Error</h4><p>There was an error in the application. Please refresh and try again. If this persists, please contact administration.</p></div>");
  }
  return false;
};

verifyLoginCredentials = function(callback) {

  /*
   * Checks the login credentials against the server.
   * This should not be used in place of sending authentication
   * information alongside a restricted action, as a malicious party
   * could force the local JS check to succeed.
   * SECURE AUTHENTICATION MUST BE WHOLLY SERVER SIDE.
   */
  var args, hash, link, secret;
  hash = $.cookie("ssarherps_auth");
  secret = $.cookie("ssarherps_secret");
  link = $.cookie("ssarherps_link");
  args = "hash=" + hash + "&secret=" + secret + "&dblink=" + link;
  $.post(adminParams.loginApiTarget, args, "json").done(function(result) {
    if (result.status === true) {
      return callback(result);
    } else {
      return goTo(result.login_url);
    }
  }).fail(function(result, status) {
    $("article").html("<div class='bs-callout-danger bs-callout'><h4>Couldn't verify login</h4><p>There's currently a server problem. Try back again soon.</p>'</div>");
    console.log(result, status);
    return false;
  });
  return false;
};

renderAdminSearchResults = function(containerSelector) {
  var args, s;
  if (containerSelector == null) {
    containerSelector = "#search-results";
  }

  /*
   * Takes parts of performSearch() but only in the admin context
   */
  s = $("#admin-search").val();
  if (isNull(s)) {
    toastStatusMessage("Please enter a search term");
    return false;
  }
  animateLoad();
  $("#admin-search").blur();
  s = s.replace(/\./g, "");
  s = prepURI(s);
  args = "q=" + s + "&loose=true";
  return $.get(searchParams.targetApi, args, "json").done(function(result) {
    var bootstrapColCount, colClass, data, html, htmlClose, htmlHead, targetCount;
    if (result.status !== true) {
      toastStatusMessage(result.human_error);
      return false;
    }
    data = result.result;
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
          var bootstrapColSize, niceKey;
          niceKey = k.replace(/_/g, " ");
          if (k === "genus" || k === "species" || k === "subspecies") {
            htmlHead += "\n\t\t<th class='text-center'>" + niceKey + "</th>";
            bootstrapColCount++;
          }
          j++;
          if (j === Object.size(row)) {
            htmlHead += "\n\t\t<th class='text-center'>Edit</th>\n\t</tr>";
            bootstrapColCount++;
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
        if (isNull(row.genus)) {
          return true;
        }
        if (k === "genus" || k === "species" || k === "subspecies") {
          htmlRow += "\n\t\t<td id='" + k + "-" + i + "' class='" + k + " " + colClass + "'>" + col + "</td>";
        }
        l++;
        if (l === Object.size(row)) {
          htmlRow += "\n\t\t<td id='" + k + "-" + i + "' class='edit-taxon " + colClass + " text-center'><paper-icon-button icon='image:edit' class='edit' data-taxon='" + taxonQuery + "'></paper-icon-button></td>";
          htmlRow += "\n\t</tr>";
          return html += htmlRow;
        }
      });
      if (toInt(i) === targetCount) {
        html = htmlHead + html + htmlClose;
        $(containerSelector).html(html);
        console.log("Processed " + (toInt(i) + 1) + " rows");
        $(".edit").click(function() {
          var taxon;
          taxon = $(this).attr('data-taxon');
          return lookupEditorSpecies(taxon);
        });
        return stopLoad();
      }
    });
  }).fail(function(result, status) {
    var error;
    console.error("There was an error performing the search");
    console.warn(result, error, result.statusText);
    error = "" + result.status + " - " + result.statusText;
    $("#search-status").attr("text", "Couldn't execute the search - " + error);
    $("#search-status")[0].show();
    return stopLoadError();
  });
};

lookupEditorSpecies = function(taxon) {
  var editHtml, html;
  if (taxon == null) {
    taxon = void 0;
  }

  /*
   * Lookup a given species and load it for editing
   */
  if (taxon == null) {
    return false;
  }
  animateLoad();
  if (!$("#modal-taxon-edit").exists()) {
    editHtml = "<paper-input label=\"Genus\" id=\"edit-genus\" name=\"edit-genus\" floatingLabel></paper-input> <paper-input label=\"Species\" id=\"edit-species\" name=\"edit-species\" floatingLabel></paper-input> <paper-input label=\"Subspecies\" id=\"edit-subspecies\" name=\"edit-subspecies\" floatingLabel></paper-input> <paper-input label=\"Common Name\" id=\"edit-common-name\" name=\"edit-common-name\" floatingLabel></paper-input> <paper-input label=\"Deprecated Scientific Names\" id=\"edit-deprecated-scientific\" name=\"edit-depreated-scientific\" floatingLabel aria-describedby=\"deprecatedHelp\"></paper-input> <span class=\"help-block\" id=\"deprecatedHelp\">List names here in the form <span class=\"code\">\"Genus species\":\"Authority: year\",\"Genus species\":\"Authority: year\",...</span></span> <paper-input label=\"Clade\" id=\"edit-major-type\" name=\"edit-major-type\" floatingLabel></paper-input> <paper-input label=\"Subtype\" id=\"edit-major-subtype\" name=\"edit-major-subtype\" floatingLabel></paper-input> <paper-input label=\"Minor clade / 'Family'\" id=\"edit-minor-type\" name=\"edit-minor-type\" floatingLabel></paper-input> <paper-input label=\"Linnean Order\" id=\"edit-linnean-order\" name=\"edit-linnean-order\" floatingLabel></paper-input> <paper-input label=\"Genus authority\" id=\"edit-genus-authority\" name=\"edit-genus-authority\" floatingLabel></paper-input> <paper-input label=\"Genus authority year\" id=\"edit-gauthyear\" name=\"edit-gauthyear\" floatingLabel></paper-input> <paper-input label=\"Species authority\" id=\"edit-species-authority\" name=\"edit-species-authority\" floatingLabel></paper-input> <paper-input label=\"Species authority year\" id=\"edit-sauthyear\" name=\"edit-sauthyear\" floatingLabel></paper-input> <paper-autogrow-textarea target=\"edit-notes\" id=\"edit-notes-autogrow\"> <textarea placeholder=\"Notes\" id=\"edit-notes\" name=\"edit-notes\"></textarea> </paper-autogrow-textarea> <paper-input label=\"Image\" id=\"edit-image\" name=\"edit-image\" floatingLabel aria-describedby=\"imagehelp\"></paper-input> <span class=\"help-block\" id=\"imagehelp\">The image path here should be relative to the <span class=\"code\">public_html/cndb/</span> directory.</span>";
    html = "<paper-action-dialog backdrop layered closeSelector=\"[dismissive]\" id='modal-taxon-edit'><div id='modal-taxon-editor'>" + editHtml + "</div><paper-button id='close-editor' dismissive>Cancel</paper-button><paper-button id='save-editor' affirmative>Save</paper-button></paper-action-dialog>";
    $("#search-results").after(html);
    $("html /deep/ #save-editor").click(function() {
      return saveEditorEntry();
    });
  }
  $.get(searchParams.targetApi, "q=" + taxon, "json").done(function(result) {
    var data, e;
    try {
      data = result.result[0];
      console.log("Populating from", data);
      $.each(data, function(col, d) {
        var fieldSelector, year;
        if (col === "authority_year") {
          year = parseTaxonYear(d);
          $("#edit-gauthyear").attr("value", year.genus);
          return $("#edit-sauthyear").attr("value", year.species);
        } else {
          fieldSelector = "#edit-" + (col.replace(/_/g, "-"));
          if (col === "deprecated_scientific") {
            d = JSON.stringify(d).slice(1, -1);
          }
          return $(fieldSelector).attr("value", d);
        }
      });
      return $("#modal-taxon-edit")[0].open();
    } catch (_error) {
      e = _error;
      return toastStatusMessage("Unable to populate the editor for this taxon - " + e.message);
    }
  }).fail(function(result, status) {
    return toastStatusMessage("There was a server error populating this taxon. Please try again.");
  });
  return false;
};

saveEditorEntry = function() {

  /*
   * Send an editor state along with login credentials,
   * and report the save result back to the user
   */
  return foo();
};

handleDragDropImage = function() {

  /*
   * Take a drag-and-dropped image, and save it out to the database.
   * If we trigger this, we need to disable #edit-image
   */
  return foo();
};

foo = function() {
  toastStatusMessage("Sorry, this feature is not yet finished");
  stopLoad();
  return false;
};

$(function() {
  var e;
  try {
    checkAdmin();
    if (adminParams.loadAdminUi === true) {
      return loadAdminUi();
    }
  } catch (_error) {
    e = _error;
    return console.warn("This page does not have the criteria to check administration");
  }
});

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
  return $(".click").unbind().click(function() {
    return openTab($(this).attr("data-url"));
  });
};

$(function() {
  bindClickTargets();
  $('[data-toggle="tooltip"]').tooltip();
  return getLocation();
});

searchParams = new Object();

searchParams.targetApi = "commonnames_api.php";

searchParams.targetContainer = "#result_container";

searchParams.apiPath = uri.urlString + searchParams.targetApi;

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
      console.log("Got filters - " + filters);
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
  console.log("Got search value " + s + ", hitting", "" + searchParams.apiPath + "?" + args);
  return $.get(searchParams.targetApi, args, "json").done(function(result) {
    var filterText, i, text;
    console.log("Search executed by " + result.method + " with " + result.count + " results.");
    if (toInt(result.count) === 0) {
      if (result.status === true) {
        if (result.query_params.filter.had_filter === true) {
          filterText = "";
          i = 0;
          $.each(result.query_params.filter.filter_params, function(col, val) {
            if (col !== "BOOLEAN_TYPE") {
              if (i !== 0) {
                filterText = "" + filter_text + " " + result.filter.filter_params.BOOLEAN_TYPE;
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
      $("#search-status").attr("text", text);
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

getFilters = function(selector, booleanType) {
  var e, encodedFilter, filterList, jsonString;
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
  if (Object.size(filterList) === 0) {
    console.log("Got back an empty filter list.");
    return "";
  }
  try {
    filterList["BOOLEAN_TYPE"] = booleanType;
    jsonString = JSON.stringify(filterList);
    encodedFilter = Base64.encodeURI(jsonString);
    console.log("Returning " + encodedFilter + " from", filterList);
    return encodedFilter;
  } catch (_error) {
    e = _error;
    return false;
  }
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

checkTaxonNear = function(taxonQuery, callback, selector) {
  var apiUrl, args, cssClass, elapsed, geoIcon, tooltipHint;
  if (taxonQuery == null) {
    taxonQuery = void 0;
  }
  if (callback == null) {
    callback = void 0;
  }
  if (selector == null) {
    selector = "html /deep/ #near-me-container";
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
    $(selector).html("<core-icon icon='" + geoIcon + "' class='small-icon " + cssClass + "' data-toggle='tooltip' id='near-me-icon'></core-icon>");
    $("html /deep/ #near-me-icon").attr("title", tooltipHint);
    $("html /deep/ #near-me-icon").tooltip();
    if (callback != null) {
      return callback();
    }
  });
  return false;
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
      yearHtml = "<div id='near-me-container'></div><p><span class='genus'>" + data.genus + "</span>, <span class='genus_authority'>" + data.genus_authority + "</span> " + year.genus + "; <span class='species'>" + data.species + "</span>, <span class='species_authority'>" + data.species_authority + "</span> " + year.species + "</p>";
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
    html = "<div id='meta-taxon-info'>" + yearHtml + "<p>Common name: <span id='taxon-common-name' class='common_name'>" + data.common_name + "</span></p><p>Type: <span id='taxon-type'>" + data.major_type + "</span> (<span id='taxon-common-type'>" + data.major_common_type + "</span>) <core-icon icon='arrow-forward'></core-icon> <span id='taxon-subtype'>" + data.major_subtype + "</span>" + minorTypeHtml + "</p>" + deprecatedHtml + "</div><h3>Taxon Notes</h3><p id='taxon-notes'>" + data.notes + "</p>";
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
    return checkTaxonNear(taxon, function() {
      return $("#modal-taxon")[0].open();
    });
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
  var e, f64, filterObj, fuzzyState, loadArgs, looseState, openFilters, queryUrl, temp;
  console.log("Doing onloads ...");
  animateLoad();
  window.addEventListener("popstate", function(e) {
    var loadArgs, temp;
    uri.query = $.url().attr("fragment");
    loadArgs = Base64.decode(uri.query);
    console.log("Popping state to " + loadArgs);
    performSearch(loadArgs);
    temp = loadArgs.split("&")[0];
    return $("#search").attr("value", temp);
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
      temp = temp.replace(/\+/, " ");
      $("#search").attr("value", temp);
      try {
        f64 = queryUrl.param("filter");
        filterObj = JSON.parse(Base64.decode(f64));
        openFilters = false;
        $.each(filterObj, function(col, val) {
          var selector;
          col = col.replace(/_/g, "-");
          selector = "#" + col + "-filter";
          if (col !== "type") {
            $(selector).attr("value", val);
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

//# sourceMappingURL=maps/c.js.map
