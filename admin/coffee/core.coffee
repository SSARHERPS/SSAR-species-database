# Basic inits
root = exports ? this

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

Object.size = (obj) ->
  size = 0
  size++ for key of obj when obj.hasOwnProperty(key)
  size

delay = (ms,f) -> setTimeout(f,ms)

roundNumber = (number,digits = 0) ->
  multiple = 10 ** digits
  Math.round(number * multiple) / multiple

jQuery.fn.exists = -> jQuery(this).length > 0

jQuery.fn.isVisible = ->
  jQuery(this).css("display") isnt "none"

jQuery.fn.hasChildren = ->
  Object.size(jQuery(this).children()) > 3

byteCount = (s) => encodeURI(s).split(/%..|./).length - 1

`function shuffle(o) { //v1.0
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}`

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


loadJS = (src, callback = new Object(), doCallbackOnError = true) ->
  ###
  # Load a new javascript file
  #
  # If it's already been loaded, jump straight to the callback
  #
  # @param string src The source URL of the file
  # @param function callback Function to execute after the script has
  #                          been loaded
  # @param bool doCallbackOnError Should the callback be executed if
  #                               loading the script produces an error?
  ###
  if $("script[src='#{src}']").exists()
    if typeof callback is "function"
      try
        callback()
      catch e
        console.error "Script is already loaded, but there was an error executing the callback function - #{e.message}"
    # Whether or not there was a callback, end the script
    return true
  # Create a new DOM selement
  s = document.createElement("script")
  # Set all the attributes. We can be a bit redundant about this
  s.setAttribute("src",src)
  s.setAttribute("async","async")
  s.setAttribute("type","text/javascript")
  s.src = src
  s.async = true
  # Onload function
  onLoadFunction = ->
    state = s.readyState
    try
      if not callback.done and (not state or /loaded|complete/.test(state))
        callback.done = true
        if typeof callback is "function"
          try
            callback()
          catch e
            console.error "Postload callback error - #{e.message}"
    catch e
      console.error "Onload error - #{e.message}"
  # Error function
  errorFunction = ->
    console.warn "There may have been a problem loading #{src}"
    try
      unless callback.done
        callback.done = true
        if typeof callback is "function" and doCallbackOnError
          try
            callback()
          catch e
            console.error "Post error callback error - #{e.message}"
    catch e
      console.error "There was an error in the error handler! #{e.message}"
  # Set the attributes
  s.setAttribute("onload",onLoadFunction)
  s.setAttribute("onreadystate",onLoadFunction)
  s.setAttribute("onerror",errorFunction)
  s.onload = s.onreadystate = onLoadFunction
  s.onerror = errorFunction
  document.getElementsByTagName('head')[0].appendChild(s)
  true


mapNewWindows = ->
  # Do new windows
  $(".newwindow").each ->
    # Add a click and keypress listener to
    # open links with this class in a new window
    curHref = $(this).attr("href")
    openInNewWindow = (url) ->
      if not url? then return false
      window.open(url)
      return false
    $(this).click ->
      openInNewWindow(curHref)
    $(this).keypress ->
      openInNewWindow(curHref)

# Animations
animateLoad = (d=50,elId="#status-container") ->
  try
    if $(elId).exists()
      sm_d = roundNumber(d * .5)
      big = $(elId).find('.ball')
      small = $(elId).find('.ball1')
      big.removeClass('stop hide')
      big.css
        width:"#{d}px"
        height:"#{d}px"
      offset = roundNumber(d / 2 + sm_d/2 + 9)
      offset2 = roundNumber((d + 10) / 2 - (sm_d+6)/2)
      small.removeClass('stop hide')
      small.css
        width:"#{sm_d}px"
        height:"#{sm_d}px"
        top:"-#{offset}px"
        'margin-left':"#{offset2}px"
      return true
    false
  catch e
    console.log('Could not animate loader', e.message);

stopLoad = (elId="#status-container") ->
    try
      if $(elId).exists()
        big = $(elId).find('.ball')
        small = $(elId).find('.ball1')
        big.addClass('bballgood ballgood')
        small.addClass('bballgood ball1good')
        delay 250, ->
          big.addClass('stop hide')
          big.removeClass('bballgood ballgood')
          small.addClass('stop hide')
          small.removeClass('bballgood ballgood')
    catch e
      console.log('Could not stop load animation', e.message);


stopLoadError = (elId="#status-container") ->
    try
      if $(elId).exists()
        big = $(elId).find('.ball')
        small = $(elId).find('.ball1')
        big.addClass('bballerror ballerror')
        small.addClass('bballerror ball1error')
        delay 1500, ->
          big.addClass('stop hide')
          big.removeClass('bballerror ballerror')
          small.addClass('stop hide')
          small.removeClass('bballerror ballerror')
    catch e
      console.log('Could not stop load error animation', e.message);

$ ->
  try
    if typeof picturefill is "function"
      window.picturefill()
  catch e
    # We don't actually care here, probably hasn't been imported
    console.warn("Could not execute picturefill.")
  mapNewWindows()
  # Load any calls the script asked for
  try
    window.totpParams.tfaLock ?= false
    window.latejs ?= new Object()
    window.latejs.done ?= false
    if window.latejs.done isnt true and window.totpParams.tfaLock isnt true
      # Has the user embedded their own scripts?
      if typeof lateJS is "function"
        lateJS()
  catch e
    console.warn("There was an error calling lateJS(). If you haven't set that up, you can safely ignore this.")
  try
    # The really last stuff
    if typeof loadLast is "function"
      loadLast()
  catch e
    console.warn("There was an error calling loadLast(). This may result in unexpected behaviour.")
