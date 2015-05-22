# Basic inits
root = exports ? this

uri = new Object()
uri.o = $.url()
uri.urlString = uri.o.attr('protocol') + '://' + uri.o.attr('host')  + uri.o.attr("directory")
uri.query = uri.o.attr("fragment")

window.locationData = new Object()
locationData.params =
  enableHighAccuracy: true
locationData.last = undefined

isBool = (str) -> str is true or str is false

isEmpty = (str) -> not str or str.length is 0

isBlank = (str) -> not str or /^\s*$/.test(str)

isNull = (str) ->
  try
    if isEmpty(str) or isBlank(str) or not str?
      unless str is false or str is 0 then return true
  catch
  false

isJson = (str) ->
  if typeof str is 'object' then return true
  try
    JSON.parse(str)
    return true
  catch
  false

isNumber = (n) -> not isNaN(parseFloat(n)) and isFinite(n)

toFloat = (str) ->
  if not isNumber(str) or isNull(str) then return 0
  parseFloat(str)

toInt = (str) ->
  if not isNumber(str) or isNull(str) then return 0
  parseInt(str)

`function toObject(arr) {
    var rv = {};
    for (var i = 0; i < arr.length; ++i)
        if (arr[i] !== undefined) rv[i] = arr[i];
    return rv;
}`

String::toBool = -> this.toString() is 'true'

Boolean::toBool = -> this.toString() is 'true' # In case lazily tested

Number::toBool = -> this is 1

Object.size = (obj) ->
  size = 0
  size++ for key of obj when obj.hasOwnProperty(key)
  size

delay = (ms,f) -> setTimeout(f,ms)

roundNumber = (number,digits = 0) ->
  multiple = 10 ** digits
  Math.round(number * multiple) / multiple

jQuery.fn.exists = -> jQuery(this).length > 0

jQuery.fn.polymerSelected = (setSelected = undefined) ->
  # See
  # https://www.polymer-project.org/docs/elements/paper-elements.html#paper-dropdown-menu
  if setSelected?
    if not isBool(setSelected)
      try
        childDropdown = $(this).find("[valueattr]")
        if isNull(childDropdown)
          childDropdown = $(this)
        prop = childDropdown.attr("valueattr")
        # Find the element where the prop matches the selected
        item = $(this).find("[#{prop}=#{setSelected}]")
        index = item.index()
        item.parent().prop("selected",index)
      catch e
        return false
    else
      console.log("setSelected #{setSelected} is boolean")
      $(this).parent().children().removeAttribute("selected")
      $(this).parent().children().removeAttribute("active")
      $(this).parent().children().removeClass("core-selected")
      $(this).prop("selected",setSelected)
      $(this).prop("active",setSelected)
      if setSelected is true
        $(this).addClass("core-selected")
  else
    val = undefined
    try
      childDropdown = $(this).find("[valueattr]")
      if isNull(childDropdown)
        childDropdown = $(this)
      prop = childDropdown.attr("valueattr")
      val = $(this).find(".core-selected").attr(prop)
    catch e
      return false
    if val is "null" or not val?
      val = undefined
    val

jQuery.fn.polymerChecked = (setChecked = undefined) ->
  # See
  # https://www.polymer-project.org/docs/elements/paper-elements.html#paper-dropdown-menu
  if setChecked?
    jQuery(this).prop("checked",setChecked)
  else
    val = jQuery(this)[0].checked
    if val is "null" or not val?
      val = undefined
    val

jQuery.fn.isVisible = ->
  jQuery(this).css("display") isnt "none"

jQuery.fn.hasChildren = ->
  Object.size(jQuery(this).children()) > 3

byteCount = (s) => encodeURI(s).split(/%..|./).length - 1

`function shuffle(o) { //v1.0
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}`

randomInt = (lower = 0, upper = 1) ->
  start = Math.random()
  if not lower?
    [lower, upper] = [0, lower]
  if lower > upper
    [lower, upper] = [upper, lower]
  return Math.floor(start * (upper - lower + 1) + lower)


window.debounce_timer = null
debounce: (func, threshold = 300, execAsap = false) ->
  # Borrowed from http://coffeescriptcookbook.com/chapters/functions/debounce
  # Only run the prototyped function once per interval.
  (args...) ->
    obj = this
    delayed = ->
      func.apply(obj, args) unless execAsap
    if window.debounce_timer?
      clearTimeout(window.debounce_timer)
    else if (execAsap)
      func.apply(obj, args)
    window.debounce_timer = setTimeout(delayed, threshold)

Function::debounce = (threshold = 300, execAsap = false, timeout = window.debounce_timer, args...) ->
  # Borrowed from http://coffeescriptcookbook.com/chapters/functions/debounce
  # Only run the prototyped function once per interval.
  func = this
  delayed = ->
    func.apply(func, args) unless execAsap
    console.log("Debounce applied")
  if timeout?
    try
      clearTimeout(timeout)
    catch e
      # just do nothing
  else if execAsap
    func.apply(obj, args)
    console.log("Executed immediately")
  window.debounce_timer = setTimeout(delayed, threshold)

`
function loadJS(src, callback) {
    console.log("Entering loadjs for",src);
    var s = document.createElement('script');
    s.setAttribute('src',src);
    s.setAttribute('async','async');
    s.setAttribute('type','text/javascript');
    s.src = src;
    s.async = true;
    var onloadfunction = function() {
        console.log("Entering readystate function");
        var state = s.readyState;
        try {
            console.log("Loaded",src);
            if (!callback.done && (!state || /loaded|complete/.test(state))) {
                callback.done = true;
                callback();
            }
        } catch (e) {
            // do nothing, no callback function passed
            console.log("Callback error");
        }
    };
    var errorfunction = function() {
        try {
            console.warn("There may have been a problem loading",src);
            if (!callback.done) {
                callback.done = true;
                callback();
            }
        } catch (e) {
            // do nothing, no callback function passed
            console.log("Error and error");
        }
    };
    s.setAttribute('onload',onloadfunction);
    s.setAttribute('onreadystate',onloadfunction);
    s.setAttribute('onerror',errorfunction);
    s.onload = s.onreadystate = onloadfunction;
    s.onerror = errorfunction;
    document.getElementsByTagName('head')[0].appendChild(s);
    console.log("Exiting with",s);
}
`

mapNewWindows = ->
  # Do new windows
  $(".newwindow").each ->
    # Add a click and keypress listener to
    # open links with this class in a new window
    curHref = $(this).attr("href")
    if not curHref?
      # Support non-standard elements
      curHref = $(this).attr("data-href")
    openInNewWindow = (url) ->
      if not url? then return false
      window.open(url)
      return false
    $(this).click ->
      openInNewWindow(curHref)
    $(this).keypress ->
      openInNewWindow(curHref)

# Animations

toastStatusMessage = (message, className = "", duration = 3000, selector = "#search-status") ->
  ###
  # Pop up a status message
  ###
  if not isNumber(duration)
    duration = 3000
  if selector.slice(0,1) is not "#"
    selector = "##{selector}"
  if not $(selector).exists()
    html = "<paper-toast id=\"#{selector.slice(1)}\" duration=\"#{duration}\"></paper-toast>"
    $(html).appendTo("body")
  $(selector).attr("text",message)
  $(selector).addClass(className)
  $(selector)[0].show()
  delay duration + 500, ->
    # A short time after it hides, clean it up
    $(selector).empty()
    $(selector).removeClass(className)
    $(selector).attr("text","")


openLink = (url) ->
  if not url? then return false
  window.open(url)
  false

openTab = (url) ->
  openLink(url)

goTo = (url) ->
  if not url? then return false
  window.location.href = url
  false

animateLoad = (elId = "loader") ->
  ###
  # Suggested CSS to go with this:
  #
  # #loader {
  #     position:fixed;
  #     top:50%;
  #     left:50%;
  # }
  # #loader.good::shadow .circle {
  #     border-color: rgba(46,190,17,0.9);
  # }
  # #loader.bad::shadow .circle {
  #     border-color:rgba(255,0,0,0.9);
  # }
  ###
  if isNumber(elId) then elId = "loader"
  if elId.slice(0,1) is "#"
    selector = elId
    elId = elId.slice(1)
  else
    selector = "##{elId}"
  try
    if not $(selector).exists()
      $("body").append("<paper-spinner id=\"#{elId}\" active></paper-spinner")
    else
      $(selector).attr("active",true)
    false
  catch e
    console.log('Could not animate loader', e.message)

stopLoad = (elId = "loader", fadeOut = 1000) ->
  if elId.slice(0,1) is "#"
    selector = elId
    elId = elId.slice(1)
  else
    selector = "##{elId}"
  try
    if $(selector).exists()
      $(selector).addClass("good")
      delay fadeOut, ->
        $(selector).removeClass("good")
        $(selector).attr("active",false)
  catch e
    console.log('Could not stop load animation', e.message)


stopLoadError = (message, elId = "loader", fadeOut = 5000) ->
  if elId.slice(0,1) is "#"
    selector = elId
    elId = elId.slice(1)
  else
    selector = "##{elId}"
  try
    if $(selector).exists()
      $(selector).addClass("bad")
      if message? then toastStatusMessage(message,"",fadeOut)
      delay fadeOut, ->
        $(selector).removeClass("bad")
        $(selector).attr("active",false)
  catch e
    console.log('Could not stop load error animation', e.message)



doCORSget = (url, args, callback = undefined, callbackFail = undefined) ->
  corsFail = ->
    if typeof callbackFail is "function"
      callbackFail()
    else
      throw new Error("There was an error performing the CORS request")
  # First try the jquery way
  settings =
    url: url
    data: args
    type: "get"
    crossDomain: true
  try
    $.ajax(settings)
    .done (result) ->
      if typeof callback is "function"
        callback()
        return false
      console.log(response)
    .fail (result,status) ->
      console.warn("Couldn't perform jQuery AJAX CORS. Attempting manually.")
  catch e
    console.warn("There was an error using jQuery to perform the CORS request. Attemping manually.")
  # Then try the long way
  url = "#{url}?#{args}"
  createCORSRequest = (method = "get", url) ->
    # From http://www.html5rocks.com/en/tutorials/cors/
    xhr = new XMLHttpRequest()
    if "withCredentials" of xhr
      # Check if the XMLHttpRequest object has a "withCredentials"
      # property.
      # "withCredentials" only exists on XMLHTTPRequest2 objects.
      xhr.open(method,url,true)
    else if typeof XDomainRequest isnt "undefined"
      # Otherwise, check if XDomainRequest.
      # XDomainRequest only exists in IE, and is IE's way of making CORS requests.
      xhr = new XDomainRequest()
      xhr.open(method,url)
    else
      xhr = null
    return xhr
  # Now execute it
  xhr = createCORSRequest("get",url)
  if !xhr
    throw new Error("CORS not supported")
  xhr.onload = ->
    response = xhr.responseText
    if typeof callback is "function"
      callback(response)
    console.log(response)
    return false
  xhr.onerror = ->
    console.warn("Couldn't do manual XMLHttp CORS request")
    # Place this in the last error
    corsFail()
  xhr.send()
  false


lightboxImages = (selector = ".lightboximage") ->
  ###
  # Lightbox images with this selector
  #
  # If the image has it, wrap it in an anchor and bind;
  # otherwise just apply to the selector.
  #
  # Plays nice with layzr.js
  # https://callmecavs.github.io/layzr.js/
  ###
  $(selector).each ->
    if $(this).prop("tagName").toLowerCase() is "img" and $(this).parent().prop("tagName").toLowerCase() isnt "a"
      tagHtml = $(this).removeClass("lightboximage").prop("outerHTML")
      imgUrl = switch
        when not isNull($(this).attr("data-layzr-retina"))
          $(this).attr("data-layzr-retina")
        when not isNull($(this).attr("data-layzr"))
          $(this).attr("data-layzr")
        else
          $(this).attr("src")
      $(this).replaceWith("<a href='#{imgUrl}' class='lightboximage'>#{tagHtml}</a>")
  ###
  #try
  #  layzr = new Layzr()
  #catch e
  #  console.warn("The Layzr library couldn't be loaded.")
  ###
  options =
      onStart: ->
        overlayOn()
      onEnd: ->
        overlayOff()
        activityIndicatorOff()
      onLoadStart: ->
        activityIndicatorOn()
      onLoadEnd: ->
        activityIndicatorOff()
      allowedTypes: 'png|jpg|jpeg|gif'
  ###
  $(selector).has("img").each ->
    if not $(this).attr("nolightbox")?
      $(this).imageLightbox(options)
  ###
  # Until these narrower selectors work, let's use this
  try
    $(selector).imageLightbox(options)
  catch e
    console.error("Unable to lightbox images!")


activityIndicatorOn = ->
  $('<div id="imagelightbox-loading"><div></div></div>' ).appendTo('body')
activityIndicatorOff = ->
  $('#imagelightbox-loading').remove()
overlayOn = ->
  $('<div id="imagelightbox-overlay"></div>').appendTo('body')
overlayOff = ->
  $('#imagelightbox-overlay').remove()

formatScientificNames = (selector = ".sciname") ->
    $(".sciname").each ->
      # Is it italic?
      nameStyle = if $(this).css("font-style") is "italic" then "normal" else "italic"
      $(this).css("font-style",nameStyle)

prepURI = (string) ->
  string = encodeURIComponent(string)
  string.replace(/%20/g,"+")


getLocation = (callback = undefined) ->
  geoSuccess = (pos,callback) ->
    window.locationData.lat = pos.coords.latitude
    window.locationData.lng = pos.coords.longitude
    window.locationData.acc = pos.coords.accuracy
    window.locationData.last = Date.now() # ms, unix time
    if callback?
      callback(window.locationData)
    false
  geoFail = (error,callback) ->
    locationError = switch error.code
      when 0 then "There was an error while retrieving your location: #{error.message}"
      when 1 then "The user prevented this page from retrieving a location"
      when 2 then "The browser was unable to determine your location: #{error.message}"
      when 3 then "The browser timed out retrieving your location."
    console.error(locationError)
    if callback?
      callback(false)
    false
  if navigator.geolocation
    navigator.geolocation.getCurrentPosition(geoSuccess,geoFail,window.locationData.params)
  else
    console.warn("This browser doesn't support geolocation!")
    if callback?
      callback(false)

bindClickTargets = ->
  $(".click")
  .unbind()
  .click ->
    openTab($(this).attr("data-url"))

browserBeware = ->
  unless window.hasCheckedBrowser?
    window.hasCheckedBrowser = 0
  try
    browsers = new WhichBrowser()
    # Firefox general buggieness
    if browsers.isBrowser("Firefox")
      warnBrowserHtml = """
      <div id="firefox-warning" class="alert alert-warning alert-dismissible fade in" role="alert">
        <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        <strong>Warning!</strong> Firefox has buggy support for <a href="http://webcomponents.org/" class="alert-link">webcomponents</a> and the <a href="https://www.polymer-project.org" class="alert-link">Polymer project</a>. If you encounter bugs, try using Chrome (reccommended), Opera, Safari, Internet Explorer, or your phone instead &#8212; they'll all be faster, too.
      </div>
      """
      $("#title").after(warnBrowserHtml)
      # Firefox doesn't auto-initalize the dismissable
      $(".alert").alert()
      console.warn("We've noticed you're using Firefox. Firefox has problems with this site, we recommend trying Google Chrome instead:","https://www.google.com/chrome/")
      console.warn("Firefox took #{window.hasCheckedBrowser * 250}ms after page load to render this error message.")
    # Fix the collapse behaviour in IE
    if browsers.isBrowser("Internet Explorer")
      $("#collapse-button").click ->
        $(".collapse").collapse("toggle")

  catch e
    if window.hasCheckedBrowser is 100
      # We've waited almost 15 seconds
      console.warn("We can't check your browser! If you're using Firefox, beware of bugs!")
      return false
    delay 250, ->
      window.hasCheckedBrowser++
      browserBeware()



$ ->
  bindClickTargets()
  formatScientificNames()
  try
    $('[data-toggle="tooltip"]').tooltip()
  catch e
    console.warn("Tooltips were attempted to be set up, but do not exist")
  try
    checkAdmin()
    if adminParams.loadAdminUi is true
      loadAdminUi()
  catch e
    # If we're not in admin, get the location
    getLocation()
  browserBeware()
