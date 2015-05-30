
/*
 * The main coffeescript file for administrative stuff
 * Triggered from admin-page.html
 */
var activityIndicatorOff, activityIndicatorOn, adminParams, animateLoad, bindClickTargets, browserBeware, byteCount, checkTaxonNear, clearSearch, createDuplicateTaxon, createNewTaxon, d$, deepJQuery, delay, deleteTaxon, doCORSget, doFontExceptions, foo, formatScientificNames, formatSearchResults, getFilters, getLocation, getMaxZ, goTo, handleDragDropImage, insertCORSWorkaround, insertModalImage, isBlank, isBool, isEmpty, isJson, isNull, isNumber, lightboxImages, loadAdminUi, loadJS, loadModalTaxonEditor, lookupEditorSpecies, mapNewWindows, modalTaxon, openLink, openTab, overlayOff, overlayOn, parseTaxonYear, performSearch, prepURI, randomInt, renderAdminSearchResults, root, roundNumber, saveEditorEntry, searchParams, setHistory, sortResults, ssar, stopLoad, stopLoadError, toFloat, toInt, toObject, toastStatusMessage, uri, verifyLoginCredentials,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __slice = [].slice;

adminParams = new Object();

adminParams.apiTarget = "admin_api.php";

adminParams.adminPageUrl = "http://ssarherps.org/cndb/admin-page.html";

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
      var articleHtml, searchForm;
      articleHtml = "<h3>\n  Welcome, " + ($.cookie("ssarherps_name")) + "\n  <span id=\"pib-wrapper-settings\" class=\"pib-wrapper\" data-toggle=\"tooltip\" title=\"User Settings\" data-placement=\"bottom\">\n    <paper-icon-button icon='settings-applications' class='click' data-url='" + data.login_url + "'></paper-icon-button>\n  </span>\n  <span id=\"pib-wrapper-exit-to-app\" class=\"pib-wrapper\" data-toggle=\"tooltip\" title=\"Go to CNDB app\" data-placement=\"bottom\">\n    <paper-icon-button icon='exit-to-app' class='click' data-url='" + uri.urlString + "' id=\"app-linkout\"></paper-icon-button>\n  </span>\n</h3>\n<div id='admin-actions-block'>\n  <div class='bs-callout bs-callout-info'>\n    <p>Please be patient while the administrative interface loads.</p>\n  </div>\n</div>";
      $("article").html(articleHtml);
      $(".pib-wrapper").tooltip();

      /*
       * Render out the admin UI
       * We want a search box that we pipe through the API
       * and display the table out for editing
       */
      searchForm = "<form id=\"admin-search-form\" onsubmit=\"event.preventDefault()\" class=\"row\">\n  <div>\n    <paper-input label=\"Search for species\" id=\"admin-search\" name=\"admin-search\" required autofocus floatingLabel class=\"col-xs-7 col-sm-8\"></paper-input>\n    <paper-fab id=\"do-admin-search\" icon=\"search\" raisedButton class=\"materialblue\"></paper-fab>\n    <paper-fab id=\"do-admin-add\" icon=\"add\" raisedButton class=\"materialblue\"></paper-fab>\n  </div>\n</form>\n<div id='search-results' class=\"row\"></div>";
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
      $("#do-admin-add").click(function() {
        return createNewTaxon();
      });
      bindClickTargets();
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
  var args, b64s, newLink, s;
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
  s = prepURI(s.toLowerCase());
  args = "q=" + s + "&loose=true";
  b64s = Base64.encodeURI(s);
  newLink = "" + uri.urlString + "#" + b64s;
  $("#app-linkout").attr("data-url", newLink);
  return $.get(searchParams.targetApi, args, "json").done(function(result) {
    var bootstrapColCount, colClass, data, html, htmlClose, htmlHead, targetCount;
    if (result.status !== true || result.count === 0) {
      stopLoadError();
      if (isNull(result.human_error)) {
        toastStatusMessage("Your search returned no results. Please try again.");
      } else {
        toastStatusMessage(result.human_error);
      }
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
            htmlHead += "\n\t\t<th class='text-center'>Edit</th>";
            bootstrapColCount++;
            htmlHead += "\n\t\t<th class='text-center'>Delete</th>\n\t</tr>";
            bootstrapColCount++;
            htmlHead += "\n<!-- End Table Headers -->";
            console.log("Got " + bootstrapColCount + " display columns.");
            bootstrapColSize = roundNumber(12 / bootstrapColCount, 0);
            return colClass = "col-md-" + bootstrapColSize;
          }
        });
      }
      taxonQuery = "" + (row.genus.trim()) + "+" + (row.species.trim());
      if (!isNull(row.subspecies)) {
        taxonQuery = "" + taxonQuery + "+" + (row.subspecies.trim());
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
          htmlRow += "\n\t\t<td id='edit-" + i + "' class='edit-taxon " + colClass + " text-center'><paper-icon-button icon='image:edit' class='edit' data-taxon='" + taxonQuery + "'></paper-icon-button></td>";
          htmlRow += "\n\t\t<td id='delete-" + i + "' class='delete-taxon " + colClass + " text-center'><paper-icon-button icon='delete' class='delete-taxon-button fadebg' data-taxon='" + taxonQuery + "' data-database-id='" + row.id + "'></paper-icon-button></td>";
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
        $(".delete-taxon-button").click(function() {
          var taxaId, taxon;
          taxon = $(this).attr('data-taxon');
          taxaId = $(this).attr('data-database-id');
          return deleteTaxon(taxaId);
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

loadModalTaxonEditor = function(extraHtml, affirmativeText) {
  var e, editHtml, html, noteArea;
  if (extraHtml == null) {
    extraHtml = "";
  }
  if (affirmativeText == null) {
    affirmativeText = "Save";
  }

  /*
   * Load a modal taxon editor
   */
  editHtml = "<paper-input label=\"Genus\" id=\"edit-genus\" name=\"edit-genus\" class=\"genus\" floatingLabel></paper-input>\n<paper-input label=\"Species\" id=\"edit-species\" name=\"edit-species\" class=\"species\" floatingLabel></paper-input>\n<paper-input label=\"Subspecies\" id=\"edit-subspecies\" name=\"edit-subspecies\" class=\"subspecies\" floatingLabel></paper-input>\n<paper-input label=\"Common Name\" id=\"edit-common-name\" name=\"edit-common-name\"  class=\"common_name\" floatingLabel></paper-input>\n<paper-input label=\"Deprecated Scientific Names\" id=\"edit-deprecated-scientific\" name=\"edit-depreated-scientific\" floatingLabel aria-describedby=\"deprecatedHelp\"></paper-input>\n  <span class=\"help-block\" id=\"deprecatedHelp\">List names here in the form <span class=\"code\">\"Genus species\":\"Authority: year\",...</span>. If not, it may not save correctly.</span>\n<paper-input label=\"Clade\" class=\"capitalize\" id=\"edit-major-type\" name=\"edit-major-type\" floatingLabel></paper-input>\n<paper-input label=\"Subtype\" class=\"capitalize\" id=\"edit-major-subtype\" name=\"edit-major-subtype\" floatingLabel></paper-input>\n<paper-input label=\"Minor clade / 'Family'\" id=\"edit-minor-type\" name=\"edit-minor-type\" floatingLabel></paper-input>\n<paper-input label=\"Linnean Order\" id=\"edit-linnean-order\" name=\"edit-linnean-order\" class=\"linnean_order\" floatingLabel></paper-input>\n<paper-input label=\"Common Type (eg., 'lizard')\" id=\"edit-major-common-type\" name=\"edit-major-common-type\" class=\"major_common_type\" floatingLabel></paper-input>\n<paper-input label=\"Genus authority\" id=\"edit-genus-authority\" name=\"edit-genus-authority\" class=\"genus_authority\" floatingLabel></paper-input>\n<paper-input label=\"Genus authority year\" id=\"edit-gauthyear\" name=\"edit-gauthyear\" floatingLabel></paper-input>\n<core-label>\n  Use Parenthesis for Genus Authority\n  <paper-toggle-button id=\"genus-authority-parens\"  checked=\"false\"></paper-toggle-button>\n</core-label>\n<paper-input label=\"Species authority\" id=\"edit-species-authority\" name=\"edit-species-authority\" class=\"species_authority\" floatingLabel></paper-input>\n<paper-input label=\"Species authority year\" id=\"edit-sauthyear\" name=\"edit-sauthyear\" floatingLabel></paper-input>\n<core-label>\n  Use Parenthesis for Species Authority\n  <paper-toggle-button id=\"species-authority-parens\" checked=\"false\"></paper-toggle-button>\n</core-label>\n<br/><br/>\n<paper-autogrow-textarea id=\"edit-notes-autogrow\" rows=\"5\">\n  <textarea placeholder=\"Notes\" id=\"edit-notes\" name=\"edit-notes\" aria-describedby=\"notes-help\" rows=\"5\"></textarea>\n</paper-autogrow-textarea>\n<span class=\"help-block\" id=\"notes-help\">You can write your notes in Markdown. (<a href=\"https://daringfireball.net/projects/markdown/syntax\" \"onclick='window.open(this.href); return false;' onkeypress='window.open(this.href); return false;'\">Official Full Syntax Guide</a>)</span>\n<paper-input label=\"Image\" id=\"edit-image\" name=\"edit-image\" floatingLabel aria-describedby=\"imagehelp\"></paper-input>\n  <span class=\"help-block\" id=\"imagehelp\">The image path here should be relative to the <span class=\"code\">public_html/cndb/</span> directory.</span>\n<paper-input label=\"Image Credit\" id=\"edit-image-credit\" name=\"edit-image-credit\" floatingLabel></paper-input>\n<paper-input label=\"Image License\" id=\"edit-image-license\" name=\"edit-image-license\" floatingLabel></paper-input>\n<paper-input label=\"Taxon Credit\" id=\"edit-taxon-credit\" name=\"edit-taxon-credit\" floatingLabel aria-describedby=\"taxon-credit-help\"></paper-input>\n  <span class=\"help-block\" id=\"taxon-credit-help\">This will be displayed as \"Taxon information by [your entry].\"</span>\n" + extraHtml + "\n<input type=\"hidden\" name=\"edit-taxon-author\" id=\"edit-taxon-author\" value=\"\" />";
  html = "<paper-action-dialog backdrop layered autoCloseDisabled closeSelector=\"#close-editor\" id='modal-taxon-edit'>\n  <div id='modal-taxon-editor'>\n    " + editHtml + "\n  </div>\n  <paper-button id='close-editor' dismissive>Cancel</paper-button>\n  <paper-button id='duplicate-taxon' dismissive>Duplicate</paper-button>\n  <paper-button id='save-editor' affirmative>" + affirmativeText + "</paper-button></paper-action-dialog>";
  if ($("#modal-taxon-edit").exists()) {
    $("#modal-taxon-edit").remove();
  }
  $("#search-results").after(html);
  try {
    noteArea = $("html /deep/ #edit-notes").get(0);
    $("html /deep/ #edit-notes-autogrow").attr("target", noteArea);
  } catch (_error) {
    e = _error;
    try {
      noteArea = $("html >>> #edit-notes").get(0);
      $("html >>> #edit-notes-autogrow").attr("target", noteArea);
    } catch (_error) {
      e = _error;
      try {
        noteArea = $("#edit-notes").get(0);
        $("#edit-notes-autogrow").attr("target", noteArea);
      } catch (_error) {
        e = _error;
        console.error("Couldn't bind autogrow");
      }
    }
  }
  $("#modal-taxon-edit").unbind();
  try {
    $("html /deep/ #save-editor").unbind();
    return $("html /deep/ #duplicate-taxon").unbind().click(function() {
      return createDuplicateTaxon();
    });
  } catch (_error) {
    e = _error;
    $("html >>> #save-editor").unbind();
    return $("html >>> #duplicate-taxon").unbind().click(function() {
      return createDuplicateTaxon();
    });
  }
};

createNewTaxon = function() {

  /*
   * Load a blank modal taxon editor, ready to make a new one
   */
  var e, whoEdited;
  animateLoad();
  loadModalTaxonEditor("", "Create");
  try {
    $("html /deep/ #duplicate-taxon").remove();
  } catch (_error) {
    e = _error;
    $("html >>> #duplicate-taxon").remove();
  }
  whoEdited = isNull($.cookie("ssarherps_fullname")) ? $.cookie("ssarherps_user") : $.cookie("ssarherps_fullname");
  try {
    $("html /deep/ #edit-taxon-author").attr("value", whoEdited);
  } catch (_error) {
    e = _error;
    $("html >>> #edit-taxon-author").attr("value", whoEdited);
  }
  try {
    $("html /deep/ #save-editor").click(function() {
      return saveEditorEntry("new");
    });
  } catch (_error) {
    e = _error;
    $("html >>> #save-editor").click(function() {
      return saveEditorEntry("new");
    });
  }
  $("#modal-taxon-edit")[0].open();
  return stopLoad();
};

createDuplicateTaxon = function() {

  /*
   * Accessed from an existing taxon modal editor.
   *
   * Remove the edited notes, remove the duplicate button, and change
   * the bidings so a new entry is created.
   */
  var e;
  animateLoad();
  try {
    try {
      $("html /deep/ #taxon-id").remove();
      $("html /deep/ #last-edited-by").remove();
      $("html /deep/ #duplicate-taxon").remove();
    } catch (_error) {
      e = _error;
      $("html >>> #taxon-id").remove();
      $("html >>> #last-edited-by").remove();
      $("html >>> #duplicate-taxon").remove();
    }
    try {
      $("html /deep/ #save-editor").text("Create").unbind().click(function() {
        return saveEditorEntry("new");
      });
    } catch (_error) {
      e = _error;
      $("html >>> #save-editor").text("Create").unbind().click(function() {
        return saveEditorEntry("new");
      });
    }
    delay(250, function() {
      return stopLoad();
    });
  } catch (_error) {
    e = _error;
    stopLoadError("Unable to duplicate taxon");
    console.error("Couldn't duplicate taxon! " + e.message);
    try {
      $("html /deep/ #modal-taxon-edit").get(0).close();
    } catch (_error) {
      e = _error;
      $("html >>> #modal-taxon-edit").get(0).close();
    }
  }
  return false;
};

lookupEditorSpecies = function(taxon) {
  var args, existensial, genusArray, k, lastEdited, originalNames, replacementNames, speciesArray, subspeciesArray, taxonArray, v;
  if (taxon == null) {
    taxon = void 0;
  }

  /*
   * Lookup a given species and load it for editing
   * Has some hooks for badly formatted taxa.
   *
   * @param taxon a URL-encoded string for a taxon.
   */
  if (taxon == null) {
    return false;
  }
  animateLoad();
  lastEdited = "<p id=\"last-edited-by\">\n  Last edited by <span id=\"taxon-author-last\" class=\"capitalize\"></span>\n</p>\n<input type='hidden' name='taxon-id' id='taxon-id'/>";
  loadModalTaxonEditor(lastEdited);
  d$("#save-editor").click(function() {
    return saveEditorEntry();
  });
  existensial = d$("#last-edited-by").exists();
  if (!existensial) {
    d$("#axon-credit-help").after(lastEdited);
  }

  /*
   * After
   * https://github.com/tigerhawkvok/SSAR-species-database/issues/33 :
   *
   * Some entries have illegal scientific names. Fix them, and assume
   * the wrong ones are deprecated.
   *
   * Therefore, "Phrynosoma (Anota) platyrhinos"  should use
   * "Anota platyrhinos" as the real name and "Phrynosoma platyrhinos"
   * as the deprecated.
   */
  replacementNames = void 0;
  originalNames = void 0;
  args = "q=" + taxon;
  if (taxon.search(/\(/) !== -1) {
    originalNames = {
      genus: "",
      species: "",
      subspecies: ""
    };
    replacementNames = {
      genus: "",
      species: "",
      subspecies: ""
    };
    taxonArray = taxon.split("+");
    k = 0;
    while (k < taxonArray.length) {
      v = taxonArray[k];
      console.log("Checking '" + v + "'");
      switch (toInt(k)) {
        case 0:
          genusArray = v.split("(");
          console.log("Looking at genus array", genusArray);
          originalNames.genus = genusArray[0].trim();
          replacementNames.genus = genusArray[1] != null ? genusArray[1].trim().slice(0, -1) : genusArray[0];
          break;
        case 1:
          speciesArray = v.split("(");
          console.log("Looking at species array", speciesArray);
          originalNames.species = speciesArray[0].trim();
          replacementNames.species = speciesArray[1] != null ? speciesArray[1].trim().slice(0, -1) : speciesArray[0];
          break;
        case 2:
          subspeciesArray = v.split("(");
          console.log("Looking at ssp array", subspeciesArray);
          originalNames.subspecies = subspeciesArray[0].trim();
          replacementNames.subspecies = subspeciesArray[1] != null ? subspeciesArray[1].trim().slice(0, -1) : subspeciesArray[0];
          break;
        default:
          console.error("K value of '" + k + "' didn't match 0,1,2!");
      }
      taxonArray[k] = v.trim();
      k++;
    }
    taxon = "" + originalNames.genus + "+" + originalNames.species;
    if (!isNull(originalNames.subspecies)) {
      taxon += originalNames.subspecies;
    }
    args = "q=" + taxon + "&loose=true";
    console.warn("Bad name! Calculated out:");
    console.warn("Should be currently", replacementNames);
    console.warn("Was previously", originalNames);
    console.warn("Pinging with", "" + uri.urlString + searchParams.targetApi + "?q=" + taxon);
  }
  $.get(searchParams.targetApi, args, "json").done(function(result) {
    var data, e, noteArea, speciesString;
    try {
      data = result.result[0];
      if (data == null) {
        stopLoadError("Sorry, there was a problem parsing the information for this taxon. If it persists, you may have to fix it manually.");
        console.error("No data returned for", "" + searchParams.targetApi + "?q=" + taxon);
        return false;
      }
      try {
        data.deprecated_scientific = JSON.parse(data.deprecated_scientific);
      } catch (_error) {
        e = _error;
      }
      if (originalNames != null) {
        toastStatusMessage("Bad information found. Please review and resave.");
        data.genus = replacementNames.genus;
        data.species = replacementNames.species;
        data.subspecies = replacementNames.subspecies;
        if (typeof data.deprecated_scientific !== "object") {
          data.deprecated_scientific = new Object();
        }
        speciesString = originalNames.species;
        if (!isNull(originalNames.subspecies)) {
          speciesString += " " + originalNames.subspecies;
        }
        data.deprecated_scientific["" + (originalNames.genus.toTitleCase()) + " " + speciesString] = "AUTHORITY: YEAR";
      }
      $.each(data, function(col, d) {
        var category, fieldSelector, whoEdited, year;
        try {
          if (typeof d === "string") {
            d = d.trim();
          }
        } catch (_error) {
          e = _error;
        }
        if (col === "id") {
          $("#taxon-id").attr("value", d);
        }
        if (col === "authority_year") {
          year = parseTaxonYear(d);
          $("#edit-gauthyear").attr("value", year.genus);
          return $("#edit-sauthyear").attr("value", year.species);
        } else if (col === "parens_auth_genus" || col === "parens_auth_species") {
          category = col.split("_").pop();
          return d$("#" + category + "-authority-parens").polymerChecked(toInt(d).toBool());
        } else if (col === "taxon_author") {
          if (d === "null" || isNull(d)) {
            $("#last-edited-by").remove();
            console.warn("Removed #last-edited-by! Didn't have an author provided for column '" + col + "', giving '" + d + "'. It's probably the first edit to this taxon.");
          } else {
            d$("#taxon-author-last").text(d);
          }
          whoEdited = isNull($.cookie("ssarherps_fullname")) ? $.cookie("ssarherps_user") : $.cookie("ssarherps_fullname");
          return d$("#edit-taxon-author").attr("value", whoEdited);
        } else {
          fieldSelector = "#edit-" + (col.replace(/_/g, "-"));
          if (col === "deprecated_scientific") {
            d = JSON.stringify(d).trim().replace(/\\/g, "");
            d = d.replace(/{/, "");
            d = d.replace(/}/, "");
            if (d === '""') {
              d = "";
            }
          }
          if (col !== "notes") {
            return d$(fieldSelector).attr("value", d);
          } else {
            return d$(fieldSelector).text(d);
          }
        }
      });
      try {
        noteArea = d$("#edit-notes").get(0);
        d$("#edit-notes-autogrow").get(0).update(noteArea);
      } catch (_error) {
        e = _error;
        console.error("Couldn't update autogrow size. Possibly related to", "https://github.com/Polymer/paper-input/issues/182");
      }
      $("#modal-taxon-edit")[0].open();
      return stopLoad();
    } catch (_error) {
      e = _error;
      stopLoadError();
      return toastStatusMessage("Unable to populate the editor for this taxon - " + e.message);
    }
  }).fail(function(result, status) {
    stopLoadError();
    return toastStatusMessage("There was a server error populating this taxon. Please try again.");
  });
  return false;
};

saveEditorEntry = function(performMode) {
  var args, auth, authYearString, dep, depA, depS, depString, e, escapeCompletion, examineIds, gYear, hash, keepCase, link, requiredNotEmpty, s64, sYear, saveObject, saveString, secret, testAuthorityYear, userVerification;
  if (performMode == null) {
    performMode = "save";
  }

  /*
   * Send an editor state along with login credentials,
   * and report the save result back to the user
   */
  examineIds = ["genus", "species", "subspecies", "common-name", "major-type", "major-common-type", "major-subtype", "minor-type", "linnean-order", "genus-authority", "species-authority", "notes", "image", "image-credit", "image-license", "taxon-author", "taxon-credit"];
  saveObject = new Object();
  escapeCompletion = false;
  try {
    $("html /deep/ paper-input /deep/ paper-input-decorator").removeAttr("isinvalid");
  } catch (_error) {
    e = _error;
    $("html >>> paper-input-button >>> paper-input-decorator").removeAttr("isinvalid");
  }
  try {
    testAuthorityYear = function(authYearDeepInputSelector) {

      /*
       * Helper function!
       * Take in a deep element selector, then run it through match
       * patterns for the authority year.
       *
       * @param authYearDeepInputSelector -- Selector for a shadow DOM
       *          element, ideally a paper-input.
       */
      var altYear, authorityRegex, d, error, linnaeusYear, nextYear, yearString, years, _ref;
      yearString = d$(authYearDeepInputSelector).val();
      error = void 0;
      linnaeusYear = 1707;
      d = new Date();
      nextYear = d.getUTCFullYear() + 1;
      authorityRegex = /^[1-2][07-9]\d{2}$|^[1-2][07-9]\d{2} (\"|')[1-2][07-9]\d{2}\1$/;
      if (!(isNumber(yearString) && (linnaeusYear < yearString && yearString < nextYear))) {
        if (!authorityRegex.test(yearString)) {
          if (yearString.search(" ") === -1) {
            error = "This must be a valid year between " + linnaeusYear + " and " + nextYear;
          } else {
            error = "Nonstandard years must be of the form: YYYY 'YYYY', eg, 1801 '1802'";
          }
        } else {
          if (yearString.search(" ") === -1) {
            error = "This must be a valid year between " + linnaeusYear + " and " + nextYear;
          } else {
            years = yearString.split(" ");
            if (!((linnaeusYear < (_ref = years[0]) && _ref < nextYear))) {
              error = "The first year must be a valid year between " + linnaeusYear + " and " + nextYear;
            }
            altYear = years[1].replace(/(\"|')/g, "");
            if (!((linnaeusYear < altYear && altYear < nextYear))) {
              error = "The second year must be a valid year between " + linnaeusYear + " and " + nextYear;
            }
            yearString = yearString.replace(/'/g, '"');
          }
        }
      }
      if (error != null) {
        escapeCompletion = true;
        console.warn("" + authYearDeepInputSelector + " failed its validity checks for " + yearString + "!");
        try {
          $("html /deep/ " + authYearDeepInputSelector + " /deep/ paper-input-decorator").attr("error", error).attr("isinvalid", "isinvalid");
        } catch (_error) {
          e = _error;
          $("html >>> " + authYearDeepInputSelector + " >>> paper-input-decorator").attr("error", error).attr("isinvalid", "isinvalid");
        }
      }
      return yearString;
    };
    try {
      gYear = testAuthorityYear("#edit-gauthyear");
      sYear = testAuthorityYear("#edit-sauthyear");
      console.log("Escape Completion State:", escapeCompletion);
    } catch (_error) {
      e = _error;
      console.error("Unable to parse authority year! " + e.message);
      authYearString = "";
    }
    auth = new Object();
    auth[gYear] = sYear;
    authYearString = JSON.stringify(auth);
  } catch (_error) {
    e = _error;
    console.error("Failed to JSON parse the authority year - " + e.message);
    authYearString = "";
  }
  saveObject["authority_year"] = authYearString;
  try {
    dep = new Object();
    try {
      depS = $("html /deep/ #edit-deprecated-scientific").val();
    } catch (_error) {
      e = _error;
      try {
        depS = $("html >>> #edit-deprecated-scientific").val();
      } catch (_error) {
        e = _error;
        depS = $("#edit-deprecated-scientific").val();
      }
    }
    depA = depS.split(",");
    $.each(depA, function(i, k) {
      var item;
      item = k.split("\":\"");
      return dep[item[0].replace(/"/g, "")] = item[1].replace(/"/g, "");
    });
    depString = JSON.stringify(dep);
  } catch (_error) {
    e = _error;
    console.warn("Failed to parse the deprecated scientifics. They may be empty.");
    depString = "";
  }
  saveObject["deprecated_scientific"] = depString;
  keepCase = ["notes", "taxon_credit", "image", "image_credit", "image_license"];
  requiredNotEmpty = ["common-name", "major-type", "linnean-order", "genus-authority", "species-authority"];
  if (!isNull(d$("#edit-image").val())) {
    requiredNotEmpty.push("image-credit");
    requiredNotEmpty.push("image-license");
  }
  $.each(examineIds, function(k, id) {
    var col, error, nullTest, thisSelector, val;
    try {
      thisSelector = "html /deep/ #edit-" + id;
      if (isNull($(thisSelector))) {
        throw "Invalid Selector";
      }
    } catch (_error) {
      e = _error;
      thisSelector = "html >>> #edit-" + id;
    }
    col = id.replace(/-/g, "_");
    val = $(thisSelector).val().trim();
    if (__indexOf.call(keepCase, col) < 0) {
      val = val.toLowerCase();
    }
    switch (id) {
      case "genus":
      case "species":
      case "subspecies":
        error = "This required field must have only letters";
        nullTest = id === "genus" || id === "species" ? isNull(val) : false;
        if (/[^A-Za-z]/m.test(val) || nullTest) {
          try {
            $("html /deep/ #edit-" + id + " /deep/ paper-input-decorator").attr("error", error).attr("isinvalid", "isinvalid");
          } catch (_error) {
            e = _error;
            $("html >>> #edit-" + id + " >>> paper-input-decorator").attr("error", error).attr("isinvalid", "isinvalid");
          }
          escapeCompletion = true;
        }
        break;
      case "common-name":
      case "major-type":
      case "linnean-order":
      case "genus-authority":
      case "species-authority":
        error = "This cannot be empty";
        if (isNull(val)) {
          try {
            $("html /deep/ #edit-" + id + " /deep/ paper-input-decorator").attr("error", error).attr("isinvalid", "isinvalid");
          } catch (_error) {
            e = _error;
            $("html >>> #edit-" + id + " >>> paper-input-decorator").attr("error", error).attr("isinvalid", "isinvalid");
          }
          escapeCompletion = true;
        }
        break;
      default:
        if (__indexOf.call(requiredNotEmpty, id) >= 0) {
          error = "This cannot be empty if an image is provided";
          if (isNull(val)) {
            try {
              $("html /deep/ #edit-" + id + " /deep/ paper-input-decorator").attr("error", error).attr("isinvalid", "isinvalid");
            } catch (_error) {
              e = _error;
              $("html >>> #edit-" + id + " >>> paper-input-decorator").attr("error", error).attr("isinvalid", "isinvalid");
            }
            escapeCompletion = true;
          }
        }
    }
    return saveObject[col] = val;
  });
  if (escapeCompletion) {
    animateLoad();
    stopLoadError("There was a problem with your entry. Please correct your entry and try again.");
    console.error("Bad characters in entry. Stopping ...");
    return false;
  }
  saveObject.id = d$("#taxon-id").val();
  saveObject.parens_auth_genus = d$("#genus-authority-parens").polymerChecked();
  saveObject.parens_auth_species = d$("#species-authority-parens").polymerChecked();
  if (performMode === "save") {
    if (!isNumber(saveObject.id)) {
      animateLoad();
      stopLoadError("The system was unable to generate a valid taxon ID for this entry. Please see the console for more details.");
      console.error("Unable to get a valid, numeric taxon id! We got '" + saveObject.id + "'.");
      console.warn("The total save object so far is:", saveObject);
      return false;
    }
  }
  saveString = JSON.stringify(saveObject);
  s64 = Base64.encodeURI(saveString);
  if (isNull(saveString) || isNull(s64)) {
    animateLoad();
    stopLoadError("The system was unable to parse this entry for the server. Please see the console for more details.");
    console.error("Unable to stringify the JSON!.");
    console.warn("The total save object so far is:", saveObject);
    console.warn("Got the output string", saveSring);
    console.warn("Sending b64 string", s64);
    return false;
  }
  hash = $.cookie("ssarherps_auth");
  secret = $.cookie("ssarherps_secret");
  link = $.cookie("ssarherps_link");
  userVerification = "hash=" + hash + "&secret=" + secret + "&dblink=" + link;
  args = "perform=" + performMode + "&" + userVerification + "&data=" + s64;
  console.log("Going to save", saveObject);
  console.log("Using mode '" + performMode + "'");
  animateLoad();
  return $.post(adminParams.apiTarget, args, "json").done(function(result) {
    if (result.status === true) {
      console.log("Server returned", result);
      if (escapeCompletion) {
        console.error("Warning! The item saved, even though it wasn't supposed to.");
        return false;
      }
      try {
        $("html /deep/ #modal-taxon-edit")[0].close();
      } catch (_error) {
        e = _error;
        $("html >>> #modal-taxon-edit")[0].close();
      }
      if (!isNull($("#admin-search").val())) {
        renderAdminSearchResults();
      }
      return false;
    }
    stopLoadError();
    toastStatusMessage(result.human_error);
    console.error(result.error);
    console.warn("Server returned", result);
    console.warn("We sent", "" + uri.urlString + adminParams.apiTarget + "?" + args);
    return false;
  }).fail(function(result, status) {
    stopLoadError("Failed to send the data to the server.");
    console.error("Server error! We sent", "" + uri.urlString + adminParams.apiTarget + "?" + args);
    return false;
  });
};

deleteTaxon = function(taxaId) {
  var args, caller, diff, taxon, taxonRaw;
  caller = $(".delete-taxon .delete-taxon-button[data-database-id='" + taxaId + "']");
  taxonRaw = caller.attr("data-taxon").replace(/\+/g, " ");
  taxon = taxonRaw.substr(0, 1).toUpperCase() + taxonRaw.substr(1);
  if (!caller.hasClass("extreme-danger")) {
    window.deleteWatchTimer = Date.now();
    delay(300, function() {
      return delete window.deleteWatchTimer;
    });
    caller.addClass("extreme-danger");
    delay(7500, function() {
      return caller.removeClass("extreme-danger");
    });
    toastStatusMessage("Click again to confirm deletion of " + taxon);
    return false;
  }
  if (window.deleteWatchTimer != null) {
    diff = Date.now() - window.deleteWatchTimer;
    console.warn("The taxon was asked to be deleted " + diff + "ms after the confirmation was prompted. Rejecting ...");
    return false;
  }
  animateLoad();
  args = "perform=delete&id=" + taxaId;
  return $.post(adminParams.apiTarget, args, "json").done(function(result) {
    if (result.status === true) {
      caller.parents("tr").remove();
      toastStatusMessage("" + taxon + " with ID " + taxaId + " has been removed from the database.");
      stopLoad();
    } else {
      stopLoadError();
      toastStatusMessage(result.human_error);
      console.error(result.error);
      console.warn(result);
    }
    return false;
  }).fail(function(result, status) {
    stopLoadError();
    toastStatusMessage("Failed to communicate with the server.");
    return false;
  });
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
  if ($("#next").exists()) {
    return $("#next").unbind().click(function() {
      return openTab(adminParams.adminPageUrl);
    });
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
  return $(".click").unbind().click(function() {
    return openTab($(this).attr("data-url"));
  });
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

$(function() {
  var e;
  bindClickTargets();
  formatScientificNames();
  try {
    $('[data-toggle="tooltip"]').tooltip();
  } catch (_error) {
    e = _error;
    console.warn("Tooltips were attempted to be set up, but do not exist");
  }
  try {
    checkAdmin();
    if (adminParams.loadAdminUi === true) {
      loadAdminUi();
    }
  } catch (_error) {
    e = _error;
    getLocation();
  }
  return browserBeware();
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
  return $.get(searchParams.targetApi, args, "json").done(function(result) {
    var filterText, i, text;
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
      clearSearch(true);
      $("#search-status").attr("text", text);
      $("#search-status")[0].show();
      stopLoadError();
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
  var bootstrapColCount, colClass, data, dontShowColumns, headers, html, htmlClose, htmlHead, targetCount;
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
  dontShowColumns = ["id", "minor_type", "notes", "major_type", "taxon_author", "taxon_credit", "image_license", "image_credit", "taxon_credit_date", "parens_auth_genus", "parens_auth_species"];
  return $.each(data, function(i, row) {
    var htmlRow, j, l, taxonQuery;
    if (toInt(i) === 0) {
      j = 0;
      htmlHead += "\n<!-- Table Headers - " + (Object.size(row)) + " entries -->";
      $.each(row, function(k, v) {
        var alt, bootstrapColSize, niceKey;
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
        return html += htmlRow;
      }
    });
    if (toInt(i) === targetCount) {
      html = htmlHead + html + htmlClose;
      $(container).html(html);
      mapNewWindows();
      lightboxImages();
      modalTaxon();
      doFontExceptions();
      $("#result-count").text(" - " + result.count + " entries");
      insertCORSWorkaround();
      return stopLoad();
    }
  });
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
    var e, tooltipHtml;
    tooltipHtml = "<div class=\"tooltip fade top in right\" role=\"tooltip\" style=\"top: 6.5em; left: 4em; right:initial; display:none\" id=\"manual-location-tooltip\">\n  <div class=\"tooltip-arrow\" style=\"top:50%;left:5px\"></div>\n  <div class=\"tooltip-inner\">" + tooltipHint + "</div>\n</div>";
    try {
      $("html /deep/ " + selector).html("<core-icon icon='" + geoIcon + "' class='small-icon " + cssClass + " near-me' data-toggle='tooltip' id='near-me-icon'></core-icon>");
      $("html /deep/ #near-me-container").after(tooltipHtml).mouseenter(function() {
        $("html /deep/ #manual-location-tooltip").css("display", "block");
        return false;
      }).mouseleave(function() {
        $("html /deep/ #manual-location-tooltip").css("display", "none");
        return false;
      });
    } catch (_error) {
      e = _error;
      $("html >>> " + selector).html("<core-icon icon='" + geoIcon + "' class='small-icon " + cssClass + " near-me' data-toggle='tooltip' id='near-me-icon'></core-icon>");
      $("html >>> #near-me-container").after(tooltipHtml).mouseenter(function() {
        $("html >>> #manual-location-tooltip").css("display", "block");
        return false;
      }).mouseleave(function() {
        $("html >>> #manual-location-tooltip").css("display", "none");
        return false;
      });
      try {
        $(selector).html("<core-icon icon='" + geoIcon + "' class='small-icon " + cssClass + "' data-toggle='tooltip' id='near-me-icon'></core-icon>");
        $("#near-me-container").after(tooltipHtml).mouseenter(function() {
          $("#manual-location-tooltip").css("display", "block");
          return false;
        }).mouseleave(function() {
          $("#manual-location-tooltip").css("display", "none");
          return false;
        });
      } catch (_error) {
        e = _error;
        console.warn("Fallback failed to draw contents on the <paper-action-dialog>");
      }
    }
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
    var buttonText, commonType, data, deprecatedHtml, e, genusAuthBlock, humanTaxon, i, minorTypeHtml, notes, outboundLink, sn, speciesAuthBlock, taxonArray, year, yearHtml, _ref;
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
      yearHtml = "<div id='near-me-container' data-toggle='tooltip' data-placement='top' title='' class='near-me'></div>\n<p>\n  <span class='genus'>" + data.genus + "</span>,\n  " + genusAuthBlock + ";\n  <span class='species'>" + data.species + "</span>,\n  " + speciesAuthBlock + "\n</p>";
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
        data.taxon_credit = "Taxon information by " + data.taxon_credit + ".";
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
    return $.get(searchParams.targetApi, "q=" + loadArgs, "json").done(function(result) {
      if (result.status === true && result.count > 0) {
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
