var animateLoad, byteCount, checkMatchPassword, checkPasswordLive, delay, doAsyncCreate, doAsyncLogin, doEmailCheck, doRemoveAccountAction, doTOTPRemove, doTOTPSubmit, evalRequirements, giveAltVerificationOptions, isBlank, isBool, isEmpty, isJson, isNull, isNumber, makeTOTP, mapNewWindows, noSubmit, popupSecret, removeAccount, resetPassword, root, roundNumber, saveTOTP, showAdvancedOptions, showInstructions, stopLoad, stopLoadError, toFloat, toInt, toggleNewUserSubmit, url, verifyPhone, _base, _base1,
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
        return small.removeClass('bballgood ballgood');
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
        return small.removeClass('bballerror ballerror');
      });
    }
  } catch (_error) {
    e = _error;
    return console.log('Could not stop load error animation', e.message);
  }
};

$(function() {
  var e, _base, _base1;
  try {
    if (typeof picturefill === "function") {
      window.picturefill();
    }
  } catch (_error) {
    e = _error;
    console.warn("Could not execute picturefill.");
  }
  mapNewWindows();
  try {
    if ((_base = window.totpParams).tfaLock == null) {
      _base.tfaLock = false;
    }
    if (window.latejs == null) {
      window.latejs = new Object();
    }
    if ((_base1 = window.latejs).done == null) {
      _base1.done = false;
    }
    if (window.latejs.done !== true && window.totpParams.tfaLock !== true) {
      if (typeof lateJS === "function") {
        lateJS();
      }
    }
  } catch (_error) {
    e = _error;
    console.warn("There was an error calling lateJS(). If you haven't set that up, you can safely ignore this.");
  }
  try {
    if (typeof loadLast === "function") {
      return loadLast();
    }
  } catch (_error) {
    e = _error;
    return console.warn("There was an error calling loadLast(). This may result in unexpected behaviour.");
  }
});

if (typeof window.passwords !== 'object') {
  window.passwords = new Object();
}

window.passwords.goodbg = "#cae682";

window.passwords.badbg = "#e5786d";

if ((_base = window.passwords).minLength == null) {
  _base.minLength = 8;
}

if ((_base1 = window.passwords).overrideLength == null) {
  _base1.overrideLength = 21;
}

if (typeof window.totpParams !== 'object') {
  window.totpParams = new Object();
}

window.totpParams.popClass = "pop-panel";

if (window.totpParams.home == null) {
  url = $.url();
  window.totpParams.home = url.attr('protocol') + '://' + url.attr('host') + '/';
}

if (window.totpParams.relative == null) {
  window.totpParams.relative = "";
}

if (window.totpParams.subdirectory == null) {
  window.totpParams.subdirectory = "";
}

window.totpParams.mainStylesheetPath = window.totpParams.relative + "css/otp_styles.css";

window.totpParams.popStylesheetPath = window.totpParams.relative + "css/otp_panels.css";

checkPasswordLive = function(selector) {
  var pass, re;
  if (selector == null) {
    selector = "#createUser_submit";
  }
  pass = $("#password").val();
  re = new RegExp("^(?:(?=^.{" + window.passwords.minLength + ",}$)((?=.*\\d)|(?=.*\\W+))(?![.\\n])(?=.*[A-Z])(?=.*[a-z]).*$)$");
  if (pass.length > window.passwords.overrideLength || pass.match(re)) {
    $("#password").css("background", window.passwords.goodbg);
    window.passwords.basepwgood = true;
  } else {
    $("#password").css("background", window.passwords.badbg);
    window.passwords.basepwgood = false;
  }
  evalRequirements();
  if (!isNull($("#password2").val())) {
    checkMatchPassword(selector);
    toggleNewUserSubmit(selector);
  }
  return false;
};

checkMatchPassword = function(selector) {
  if (selector == null) {
    selector = "#createUser_submit";
  }
  if ($("#password").val() === $("#password2").val()) {
    $('#password2').css('background', window.passwords.goodbg);
    window.passwords.passmatch = true;
  } else {
    $('#password2').css('background', window.passwords.badbg);
    window.passwords.passmatch = false;
  }
  toggleNewUserSubmit(selector);
  return false;
};

toggleNewUserSubmit = function(selector) {
  var dbool, e;
  if (selector == null) {
    selector = "#createUser_submit";
  }
  try {
    dbool = !(window.passwords.passmatch && window.passwords.basepwgood);
    return $("#createUser_submit").attr("disabled", dbool);
  } catch (_error) {
    e = _error;
    window.passwords.passmatch = false;
    return window.passwords.basepwgood = false;
  }
};

evalRequirements = function() {
  var green_channel, html, moz_css, new_end, notice, pass, pstrength, red_channel, webkit_css;
  if (!$("#strength-meter").exists()) {
    html = "<div id='strength-meter'><div id='strength-requirements'><p style='float:left;margin-top:2em'>Character Classes:</p><div id='strength-alpha'><p class='label'>a</p><div class='strength-eval'></div></div><div id='strength-alphacap'><p class='label'>A</p><div class='strength-eval'></div></div><div id='strength-numspecial'><p class='label'>1/!</p><div class='strength-eval'></div></div></div><div id='strength-bar'><label for='password-strength'>Strength: </label><progress id='password-strength' max='5'></progress><p>Time to crack: <span id='crack-time'></span></p></div></div>";
    notice = "<p><small>We require a password of at least " + window.passwords.minLength + " characters with at least one upper case letter, at least one lower case letter, and at least one digit or special character. You can also use <a href='http://imgs.xkcd.com/comics/password_strength.png'>any long password</a> of at least " + window.passwords.overrideLength + " characters, with no security requirements.</small></p>";
    $("#password_security").html(html + notice);
  }
  pass = $("#password").val();
  pstrength = zxcvbn(pass);
  green_channel = (toInt(pstrength.score) + 1) * 51;
  red_channel = 255 - toInt(Math.pow(pstrength.score, 2) * 16);
  if (red_channel < 0) {
    red_channel = 0;
  }
  new_end = "rgb(" + red_channel + "," + green_channel + ",0)";
  webkit_css = "\nprogress[value]::-webkit-progress-value { background: -webkit-linear-gradient(left,rgb(255,0,30)," + new_end + "), -webkit-linear-gradient(top,rgba(255, 255, 255, .5), rgba(0, 0, 0, .5)); }";
  moz_css = "\nprogress::-moz-progress-bar { background: -moz-linear-gradient(left,rgb(255,0,30)," + new_end + "), -moz-linear-gradient(top,rgba(255, 255, 255, .5), rgba(0, 0, 0, .5)); }";
  if (!$("#dynamic").exists()) {
    $("<style type='text/css' id='dynamic' />").appendTo("head");
  }
  $("#dynamic").text(webkit_css + moz_css);
  $(".strength-eval").css("background", window.passwords.badbg);
  if (pass.length >= window.passwords.overrideLength) {
    $(".strength-eval").css("background", window.passwords.goodbg);
  } else {
    if (pass.match(/^(?:((?=.*\d)|(?=.*\W+)).*$)$/)) {
      $("#strength-numspecial .strength-eval").css("background", window.passwords.goodbg);
    }
    if (pass.match(/^(?=.*[a-z]).*$/)) {
      $("#strength-alpha .strength-eval").css("background", window.passwords.goodbg);
    }
    if (pass.match(/^(?=.*[A-Z]).*$/)) {
      $("#strength-alphacap .strength-eval").css("background", window.passwords.goodbg);
    }
  }
  $("#password-strength").attr("value", pstrength.score + 1);
  return $("#crack-time").text(pstrength.crack_time_display);
};

doEmailCheck = function() {};

doTOTPSubmit = function(home) {
  var ajaxLanding, args, code, ip, pass, totp, urlString, user;
  if (home == null) {
    home = window.totpParams.home;
  }
  noSubmit();
  animateLoad();
  code = $("#totp_code").val();
  user = $("#username").val();
  pass = $("#password").val();
  ip = $("#remote").val();
  url = $.url();
  ajaxLanding = "async_login_handler.php";
  urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + window.totpParams.subdirectory + ajaxLanding;
  args = "action=verifytotp&code=" + code + "&user=" + user + "&password=" + pass + "&remote=" + ip;
  totp = $.post(urlString, args, 'json');
  totp.done(function(result) {
    var e, i;
    if (result.status === true) {
      try {
        $("#totp_message").text("Correct!").removeClass("error").addClass("good");
        i = 0;
        return $.each(result["cookies"].raw_cookie, function(key, val) {
          var e;
          try {
            $.cookie(key, val, result["cookies"].expires);
          } catch (_error) {
            e = _error;
            console.error("Couldn't set cookies", result["cookies"].raw_cookie);
          }
          i++;
          if (i === Object.size(result["cookies"].raw_cookie)) {
            if (home == null) {
              home = url.attr('protocol') + '://' + url.attr('host') + '/';
            }
            stopLoad();
            return delay(500, function() {
              return window.location.href = home;
            });
          }
        });
      } catch (_error) {
        e = _error;
        return console.error("Unexpected error while validating", e.message);
      }
    } else {
      $("#totp_message").text(result.human_error).addClass("error");
      $("#totp_code").val("");
      $("#totp_code").focus();
      stopLoadError();
      return console.error("Invalid code error", result.error, result);
    }
  });
  return totp.fail(function(result, status) {
    $("#totp_message").text("Failed to contact server. Please try again.").addClass("error");
    console.error("AJAX failure", urlString + "?" + args, result, status);
    return stopLoadError();
  });
};

doTOTPRemove = function() {
  var ajaxLanding, args, code, pass, remove_totp, urlString, user;
  noSubmit();
  animateLoad();
  user = $("#username").val();
  pass = encodeURIComponent($("#password").val());
  code = $("#code").val();
  url = $.url();
  ajaxLanding = "async_login_handler.php";
  urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + window.totpParams.subdirectory + ajaxLanding;
  args = "action=removetotp&code=" + code + "&username=" + user + "&password=" + pass + "&base64=true";
  remove_totp = $.post(urlString, args, 'json');
  remove_totp.done(function(result) {
    if (result.status !== true) {
      $("#totp_message").text(result.human_error).addClass("error");
      console.error(result.error);
      console.warn("" + urlString + "?" + args);
      console.warn(result);
      stopLoadError();
      return false;
    }
    $("#totp_message").removeClass('error').addClass('good').text("Two-factor authentication removed for " + result.username + ".");
    $("#totp_remove").remove();
    console.log(urlString + "?" + args);
    console.log(result);
    stopLoad();
    return false;
  });
  return remove_totp.fail(function(result, status) {
    $("#totp_message").text("Failed to contact server. Please try again.").addClass("error");
    console.error("AJAX failure", urlString + "?" + args, result, status);
    return stopLoadError();
  });
};

makeTOTP = function() {
  var ajaxLanding, args, hash, key, password, totp, urlString, user;
  noSubmit();
  animateLoad();
  user = $("#username").val();
  password = $("#password").val();
  hash = $("#hash").val();
  key = $("#secret").val();
  url = $.url();
  ajaxLanding = "async_login_handler.php";
  urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + window.totpParams.subdirectory + ajaxLanding;
  args = "action=maketotp&password=" + password + "&user=" + user;
  totp = $.post(urlString, args, 'json');
  totp.done(function(result) {
    var barcodeDiv, html, raw, show_alt, show_secret_id, svg;
    if (result.status === true) {
      $("#totp_message").html("To continue, scan this barcode with your smartphone authenticator application. <small><a href='#' id='alt_totp_help'>Don't have the app?</a></small>").removeClass("error").addClass("good");
      console.log(result);
      svg = result.svg;
      raw = result.raw;
      show_secret_id = "show_secret";
      show_alt = "showAltBarcode";
      barcodeDiv = "secretBarcode";
      html = "<form id='totp_verify' onsubmit='event.preventDefault();'> <p style='font-weight:bold'>If you're unable to do so, <a href='#' id='" + show_secret_id + "'>click here to manually input your key.</a></p> <div id='" + barcodeDiv + "'> " + result.svg + " <p>Don't see the barcode? <a href='#' id='" + show_alt + "' role='button' class='btn btn-link'>Click here</a></p> </div> <p>Once you've done so, enter the code generated by your app in the field below to verify your setup.</p> <fieldset> <legend>Confirmation</legend> <input type='number' pattern='[0-9]{6}' size='6' maxlength='6' id='code' name='code' placeholder='Code'/> <input type='hidden' id='username' name='username' value='" + user + "'/> <input type='hidden' id='hash' name='hash' value='" + hash + "'/> <input type='hidden' id='secret' name='secret' value='" + key + "'/> <button id='verify_totp_button' class='totpbutton'>Verify</button> </fieldset> </form>";
      $("#totp_start").remove();
      $("#totp_message").after(html);
      $("#alt_totp_help").click(function() {
        return showInstructions();
      });
      $("#" + show_secret_id).click(function() {
        return popupSecret(result.human_secret);
      });
      $("#" + show_alt).click(function() {
        var altImg;
        altImg = "<img src='" + result.raw + "' alt='TOTP barcode'/>";
        $("" + barcode_div).html(altImg);
        return $("#" + show_alt).remove();
      });
      $("#verify_totp_button").click(function() {
        noSubmit();
        return saveTOTP(key, hash);
      });
      $("#totp_verify").submit(function() {
        noSubmit();
        return saveTOTP(key, hash);
      });
      return stopLoad();
    } else {
      console.error("Couldn't generate TOTP code", urlString + "?" + args);
      console.warn(result);
      $("#totp_message").text("There was an error generating your code. " + result.message).addClass("error");
      return stopLoadError();
    }
  });
  totp.fail(function(result, status) {
    $("#totp_message").text("Failed to contact server. Please try again.").addClass("error");
    console.error("AJAX failure", urlString + "?" + args, result, status);
    return stopLoadError();
  });
  return false;
};

saveTOTP = function(key, hash) {
  var ajaxLanding, args, code, totp, urlString, user;
  noSubmit();
  animateLoad();
  code = $("#code").val();
  hash = $("#hash").val();
  key = $("#secret").val();
  user = $("#username").val();
  url = $.url();
  ajaxLanding = "async_login_handler.php";
  urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + window.totpParams.subdirectory + ajaxLanding;
  args = "action=savetotp&secret=" + key + "&user=" + user + "&hash=" + hash + "&code=" + code;
  totp = $.post(urlString, args, 'json');
  totp.done(function(result) {
    var html;
    if (result.status === true) {
      html = "<h1>Done!</h1><h2>Write down and save this backup code. Without it, you cannot disable two-factor authentication if you lose your device.</h2><pre id='backup_code'>" + result.backup + "</pre><br/><button id='to_home'>Home &#187;</a>";
      $("#totp_add").html(html);
      $("#to_home").click(function() {
        return window.location.href = window.totpParams.home;
      });
      return stopLoad();
    } else {
      html = "<p class='error' id='temp_error'>" + result.human_error + "</p>";
      if (!$("#temp_error").exists()) {
        $("#verify_totp_button").after(html);
      } else {
        $("#temp_error").html(html);
      }
      console.error(result.error);
      return stopLoadError();
    }
  });
  return totp.fail(function(result, status) {
    $("#totp_message").text("Failed to contact server. Please try again.");
    console.error("AJAX failure", result, status);
    return stopLoadError();
  });
};

popupSecret = function(secret) {
  var html;
  $("<link/>", {
    rel: "stylesheet",
    type: "text/css",
    media: "screen",
    href: window.totpParams.popStylesheetPath
  }).appendTo("head");
  html = "<div id='cover_wrapper'><div id='secret_id_panel' class='" + window.totpParams.popClass + " cover_content'><p class='close-popup'>X</p><h2>" + secret + "</h2></div></div>";
  $("article").after(html);
  $("article").addClass("blur");
  return $(".close-popup").click(function() {
    $("#cover_wrapper").remove();
    return $("article").removeClass("blur");
  });
};

giveAltVerificationOptions = function() {
  var ajaxLanding, args, messages, pane_id, pane_messages, remove_id, sms, sms_id, urlString, user;
  url = $.url();
  ajaxLanding = "async_login_handler.php";
  urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + window.totpParams.subdirectory + ajaxLanding;
  user = $("#username").val();
  args = "action=cansms&user=" + user;
  remove_id = "remove_totp_link";
  sms_id = "send_totp_sms";
  pane_id = "alt_auth_pane";
  pane_messages = "alt_auth_messages";
  if ($("#" + pane_id).exists()) {
    $("#" + pane_id).toggle("fast");
    return false;
  }
  messages = new Object();
  messages.remove = "<a href='#' id='" + remove_id + "' role='button' class='btn btn-default'>Remove two-factor authentication</a>";
  sms = $.get(urlString, args, 'json');
  sms.done(function(result) {
    var html, pop_content;
    if (result[0] === true) {
      messages.sms = "<a href='#' id='" + sms_id + "' role='button' class='btn btn-default'>Send SMS</a>";
    } else {
      console.warn("Couldn't get a valid result", result, urlString + "?" + args);
    }
    pop_content = "";
    $.each(messages, function(k, v) {
      return pop_content += v;
    });
    html = "<div id='" + pane_id + "'><p>" + pop_content + "</p><p id='" + pane_messages + "'></p></div>";
    $("#totp_submit").after(html);
    return $("#" + sms_id).click(function() {
      var sms_totp;
      args = "action=sendtotptext&user=" + user;
      sms_totp = $.get(urlString, args, 'json');
      console.log("Sending message ...", urlString + "?" + args);
      sms_totp.done(function(result) {
        if (result.status === true) {
          $("#" + pane_id).remove();
          return $("#totp_message").text(result.message);
        } else {
          $("#" + pane_messages).addClass("error").text(result.human_error);
          return console.error(result.error);
        }
      });
      return sms_totp.fail(function(result, status) {
        console.error("AJAX failure trying to send TOTP text", urlString + "?" + args);
        return console.error("Returns:", result, status);
      });
    });
  });
  sms.fail(function(result, status) {
    return console.error("Could not check SMS-ability", result, status);
  });
  return sms.always(function() {
    return $("#" + remove_id).click(function() {
      var html;
      html = "\n  <p id='totp_message' class='error'>Are you sure you want to disable two-factor authentication?</p>\n  <form id='totp_remove' onsubmit='event.preventDefault();'>\n    <fieldset>\n      <legend>Remove Two-Factor Authentication</legend>\n      <input type='email' value='" + user + "' readonly='readonly' id='username' name='username'/><br/>\n      <input type='password' id='password' name='password' placeholder='Password'/><br/>\n      <input type='text' id='code' name='code' placeholder='Authenticator Code or Backup Code' size='32' maxlength='32' autocomplete='off'/><br/>\n      <button id='remove_totp_button' class='totpbutton btn btn-danger'>Remove Two-Factor Authentication</button>\n    </fieldset>\n  </form>\n";
      $("#totp_prompt").html(html).attr("id", "totp_remove_section");
      $("#totp_remove").submit(function() {
        return doTOTPRemove();
      });
      return $("#remove_totp_button").click(function() {
        return doTOTPRemove();
      });
    });
  });
};

verifyPhone = function() {
  var ajaxLanding, args, auth, urlString, user, verifyPhoneAjax;
  noSubmit();
  url = $.url();
  ajaxLanding = "async_login_handler.php";
  urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + window.totpParams.subdirectory + ajaxLanding;
  auth = $("#phone_auth").val() != null ? $("#phone_auth").val() : null;
  user = $("#username").val();
  args = "action=verifyphone&username=" + user + "&auth=" + auth;
  verifyPhoneAjax = $.get(urlString, args, 'json');
  verifyPhoneAjax.done(function(result) {
    var message, setClass;
    if (result.status === false) {
      if (!$("#phone_verify_message").exists()) {
        $("#phone").before("<p id='phone_verify_message'></p>");
      }
      if (result.is_good === true) {
        $("#verify_phone_button").remove();
        message = "You've already verified your phone number, thanks!";
        setClass = "good";
      } else {
        message = result.human_error;
        setClass = "error";
        console.error(result.error);
      }
      $("#phone_verify_message").text(message).addClass(setClass);
      if (result.fatal === true) {
        $("#verify_phone_button").attr("disabled", true);
        $("#verify_phone").unbind('submit').attr("onsubmit", "");
      }
      return false;
    }
    if (result.status === true) {
      if (!$("#phone_auth").exists()) {
        $("#username").after("<br/><input type='text' length='8' name='phone_auth' id='phone_auth' placeholder='Authorization Code'/>");
      }
      if (!$("#phone_verify_message").exists()) {
        $("#phone").before("<p id='phone_verify_message'></p>");
      }
      $("#phone_verify_message").text(result.message);
      if (result.is_good !== true) {
        return $("#verify_phone_button").text("Confirm");
      } else {
        $("#phone_auth").remove();
        $("#verify_later").remove();
        return $("#verify_phone_button").html("Continue &#187; ").unbind('click').click(function() {
          return window.location.href = window.totpParams.home;
        });
      }
    } else {
      console.warn("Unexpected condition encountered verifying the phone number", urlString);
      console.log(result);
      return false;
    }
  });
  return verifyPhoneAjax.fail(function(result, status) {
    console.error("AJAX failure trying to send phone verification text", urlString + "?" + args);
    return console.error("Returns:", result, status);
  });
};

showInstructions = function(path) {
  if (path == null) {
    path = "help/instructions_pop.html";
  }
  $("<link/>", {
    rel: "stylesheet",
    type: "text/css",
    media: "screen",
    href: window.totpParams.popStylesheetPath
  }).appendTo("head");
  return $.get(window.totpParams.relative + path).done(function(html) {
    var assetPath;
    $("article").after(html);
    $("article").addClass("blur");
    assetPath = "" + window.totpParams.relative + "assets/";
    $(".android").html("<img src='" + assetPath + "playstore.png' alt='Google Play Store'/>");
    $(".ios").html("<img src='" + assetPath + "appstore.png' alt='iOS App Store'/>");
    $(".wp8").html("<img src='" + assetPath + "wpstore.png' alt='Windows Phone Store'/>");
    $(".large_totp_icon").each(function() {
      var newSource;
      newSource = assetPath + $(this).attr("src");
      return $(this).attr("src", newSource);
    });
    $(".app_link_container a").addClass("newwindow");
    mapNewWindows();
    return $(".close-popup").click(function() {
      $("article").removeClass("blur");
      return $("#cover_wrapper").remove();
    });
  }).fail(function(result, status) {
    return console.error("Failed to load instructions @ " + path, result, status);
  });
};

showAdvancedOptions = function(domain, has2fa) {
  var advancedListId, html;
  advancedListId = "advanced_options_list";
  if ($("#" + advancedListId).exists()) {
    $("#" + advancedListId).toggle("fast");
    return true;
  }
  html = "<ul id='" + advancedListId + "'>";
  html += "<li><a href='?2fa=t' role='button' class='btn btn-default'>Configure Two-Factor Authentication</a></li>";
  html += "<li><a href='#' id='removeAccount' role='button' class='btn btn-default'>Remove Account</a></li>";
  $("#settings_list").after(html);
  return $("#removeAccount").click(function() {
    return removeAccount(this, "" + domain + "_user", has2fa);
  });
};

removeAccount = function(caller, cookie_key, has2fa) {
  var html, removal_button, section_id, tfaBlock, username;
  if (has2fa == null) {
    has2fa = true;
  }
  username = $.cookie(cookie_key);
  removal_button = "remove_acct_button";
  section_id = "remove_account_section";
  tfaBlock = has2fa ? "\n      <input type='text' id='code' name='code' placeholder='Authenticator Code or Backup Code' size='32' maxlength='32' autocomplete='off'/><br/>" : "";
  html = "<section id='" + section_id + "'>\n  <p id='remove_message' class='error'>Are you sure you want to remove your account?</p>\n  <form id='account_remove' onsubmit='event.preventDefault();'>\n    <fieldset>\n      <legend>Remove My Account</legend>\n      <input type='email' value='" + username + "' readonly='readonly' id='username' name='username'/><br/>\n      <input type='password' id='password' name='password' placeholder='Password'/><br/>" + tfaBlock + "\n      <button id='" + removal_button + "' class='totpbutton btn btn-danger'>Remove My Account Permanantly</button> <button onclick=\"window.location.href=totpParams.home\" class='btn btn-primary'>Back to Safety</button>\n    </fieldset>\n  </form>\n</section>";
  if ($("#login_block").exists()) {
    $("#login_block").replaceWith(html);
  } else {
    $(caller).after(html);
  }
  $("#" + removal_button).click(function() {
    return doRemoveAccountAction();
  });
  return $("#account_remove").submit(function() {
    return doRemoveAccountAction();
  });
};

doRemoveAccountAction = function() {
  var ajaxLanding, args, code, password, urlString, username;
  animateLoad();
  url = $.url();
  ajaxLanding = "async_login_handler.php";
  urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + window.totpParams.subdirectory + ajaxLanding;
  username = $("#username").val();
  password = $("#password").val();
  code = $("#code").exists() ? $("#code").val() : false;
  args = "action=removeaccount&username=" + username + "&password=" + password + "&code=" + code;
  return $.post(urlString, args, 'json').done(function(result) {
    if (result.status === true) {
      $("#remove_message").text("Your account has been successfully deleted.");
      $.each($.cookie(), function(k, v) {
        return $.removeCookie(k, {
          path: '/'
        });
      });
      delay(3000, function() {
        return window.location.href = window.totpParams.home;
      });
      return stopLoad();
    } else {
      $("#remove_message").text("There was an error removing your account. Please try again.");
      console.error("Got an error-result: ", result.error);
      console.warn(urlString + "?" + args, result);
      return stopLoadError();
    }
  }).fail(function(result, status) {
    $("#remove_message").text(result.error).addClass("error");
    $("totp_code").val("");
    console.error("Ajax Failure", urlString + "?" + args, result, status);
    return stopLoadError();
  });
};

noSubmit = function() {
  event.preventDefault();
  return event.returnValue = false;
};

doAsyncLogin = function(uri, respectRelativePath) {
  var args, pass64, password, urlString, username;
  if (uri == null) {
    uri = "async_login_handler.php";
  }
  if (respectRelativePath == null) {
    respectRelativePath = true;
  }
  noSubmit();
  if (respectRelativePath) {
    urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + window.totpParams.subdirectory + uri;
  } else {
    urlString = uri;
  }
  username = $("#username").val();
  password = $("#password").val();
  pass64 = Base64.encodeURI(password);
  args = "action=dologin&username=" + username + "&password=" + pass64 + "&b64=true";
  return false;
};

doAsyncCreate = function() {
  var recaptchaResponse;
  recaptchaResponse = grecaptcha.getResponse();
  if (recaptchaResponse.success !== true) {
    $("#createUser_submit").before("<p id='createUser_fail' class='bg-danger'>Sorry, your CAPTCHA was incorrect. Please try again.</p>");
    grecaptcha.reset();
    return false;
  }
  $("#createUser_fail").remove();
  return false;
};

resetPassword = function() {

  /*
   * Reset the user password
   */
  var html, pane_messages, resetFormSubmit;
  $("#password").remove();
  $("#login_button").remove();
  html = "<button id='login_button' class='btn btn-danger'>Check User</button>";
  pane_messages = "reset-user-messages";
  $("#login").before("<div id='" + pane_messages + "'");
  $("#login").append(html);
  $("#" + pane_messages).addClass("bg-warning").text("Once your password has been reset, your old password will be invalid.");
  resetFormSubmit = function() {
    var ajaxLanding, args, multiOptionBinding, urlString, user;
    url = $.url();
    ajaxLanding = "async_login_handler.php";
    urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + window.totpParams.subdirectory + ajaxLanding;
    user = $("#username").val();
    args = "action=resetpass&username=" + user;
    multiOptionBinding = function(pargs) {
      if (pargs == null) {
        pargs = args;
      }
      $(".reset-pass-button").click(function() {
        var method;
        method = $(this).attr("data-method");
        pargs = "" + pargs + "&method=" + method;
        $.post(urlString, pargs, "json").done(function(result) {
          if (result.status === false) {
            $("#" + pane_messages).removeClass("bg-warning bg-primary").addClass("bg-danger").text("There was a problem resetting your password. Please try again");
          } else {
            $("#" + pane_messages).removeClass("bg-warning bg-danger").addClass("bg-primary").text("Check your " + method + " for your new password. We strongly encourage you to change it!");
          }
          return false;
        }).fail(function(result, status) {
          return false;
        });
        return false;
      });
      return false;
    };
    return $.get(urlString, args, "json").done(function(result) {
      var doTotpSubmission, sms_id, text_html, usedSms;
      if (result.status === false) {
        $("#username").prop("disabled", true);
        switch (result.action) {
          case "GET_TOTP":
            usedSms = false;
            html = "<div id='start-reset-process'><button id='totp-submit' class='btn btn-primary'>Verify</button></div>";
            $("#login").append(html);
            if (result.canSMS) {
              sms_id = "reset-user-sms-totp";
              text_html = "<button class='btn btn-default' id='" + sms_id + "'>Text Code</button>";
              $("#start-reset-process").append(text_html);
              $("#" + sms_id).click(function() {
                var smsArgs, sms_totp;
                smsArgs = "action=sendtotptext&user=" + user;
                sms_totp = $.get(urlString, smsArgs, 'json');
                console.log("Sending message ...", urlString + "?" + args);
                sms_totp.done(function(result) {
                  if (result.status === true) {
                    $("#" + pane_messages).text("Your code has been sent to your registered number.").removeClass("bg-warning bg-danger").addClass("bg-primary");
                    return usedSms = true;
                  } else {
                    $("#" + pane_messages).addClass("bg-danger").text(result.human_error);
                    return console.error(result.error);
                  }
                });
                return sms_totp.fail(function(result, status) {
                  $("#" + pane_messages).addClass("bg-danger").text("There was a problem sending your text. Please try again.");
                  console.error("AJAX failure trying to send TOTP text", urlString + "?" + args);
                  return console.error("Returns:", result, status);
                });
              });
            }
            doTotpSubmission = function() {
              var totpValue;
              totpValue = $("#totp").val();
              args = "" + args + "&totp=" + totpValue;
              $("#start-reset-process").remove();
              html = "";
              if (result.canSMS && usedSms !== true) {
                html = "<button class='reset-pass-button btn btn-primary' data-method='text'>Text New Password</button>";
                false;
              }
              html = "" + html + "<button class='reset-pass-button btn btn-primary' data-method='email'>Email New Password</button>";
              $("#login").append(html);
              multiOptionBinding(args);
              return false;
            };
            $("#totp-submit").click(function() {
              noSubmit();
              return doTotpSubmission();
            });
            $("#login-totp-form").submit(function() {
              noSubmit();
              return doTotpSubmission();
            });
            break;
          case "NEED_METHOD":
            $("#login_button").remove();
            html = "<button class='reset-pass-button btn btn-primary' data-method='text'>Text New Password</button>";
            html = "" + html + "<button class='reset-pass-button btn btn-primary' data-method='email'>Email New Password</button>";
            $("#login").append(html);
            multiOptionBinding();
            false;
            break;
          case "BAD_USER":
            $("#" + pane_messages).addClass("bg-danger").text("Sorry, that user doesn't exist.");
            $("#username").prop("disabled", false).val("");
            false;
        }
      }
      $("#" + pane_messages).removeClass("bg-warning").addClass("bg-primary").text("Check your email for your new password. We strongly encourage you to change it!");
      return false;
    }).fail(function(result, status) {
      return false;
    });
  };
  $("#login_button").click(function() {
    noSubmit();
    return resetFormSubmit();
  });
  return $("#login").submit(function() {
    noSubmit();
    return resetFormSubmit();
  });
};

$(function() {
  var e, selector;
  if (window.passwords.submitSelector == null) {
    selector = "#createUser_submit";
  } else {
    selector = window.passwords.submitSelector;
  }
  if ($("#password.create").exists()) {
    loadJS(window.totpParams.relative + "js/zxcvbn/zxcvbn.js");
    $("#password.create").keyup(function() {
      return checkPasswordLive();
    }).change(function() {
      return checkPasswordLive();
    });
    $("#password2").change(function() {
      return checkMatchPassword();
    }).keyup(function() {
      return checkMatchPassword();
    });
  }
  $("#totp_submit").submit(function() {
    return doTOTPSubmit();
  });
  $("#verify_totp_button").click(function() {
    return doTOTPSubmit();
  });
  $("#totp_start").submit(function() {
    return makeTOTP();
  });
  $("#add_totp_button").click(function() {
    return makeTOTP();
  });
  $("#totp_remove").submit(function() {
    return doTOTPRemove();
  });
  $("#remove_totp_button").click(function() {
    return doTOTPRemove();
  });
  $("#alternate_verification_prompt").click(function() {
    giveAltVerificationOptions();
    return false;
  });
  $("#verify_phone").submit(function() {
    return verifyPhone();
  });
  $("#verify_phone_button").click(function() {
    return verifyPhone();
  });
  $("#verify_later").click(function() {
    return window.location.href = window.totpParams.home;
  });
  $("#totp_help").click(function() {
    return showInstructions();
  });
  $("#showAdvancedOptions").click(function() {
    var domain, has2fa;
    domain = $(this).attr('data-domain');
    has2fa = $(this).attr("data-user-tfa") === 'true' ? true : false;
    return showAdvancedOptions(domain, has2fa);
  });
  try {
    if ($.url().param("showhelp") != null) {
      showInstructions();
    }
  } catch (_error) {
    e = _error;
    delay(300, function() {
      if ($.url().param("showhelp") != null) {
        return showInstructions();
      }
    });
  }
  $("#next.continue").click(function() {
    return window.location.href = window.totpParams.home;
  });
  return $("<link/>", {
    rel: "stylesheet",
    type: "text/css",
    media: "screen",
    href: window.totpParams.mainStylesheetPath
  }).appendTo("head");
});

//# sourceMappingURL=maps/c.js.map
