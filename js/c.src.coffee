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
          small.removeClass('bballgood ball1good')
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
          small.removeClass('bballerror ball1error')
    catch e
      console.log('Could not stop load error animation', e.message);

$ ->
  try
    window.picturefill()
  catch e
    # We don't actually care here, probably hasn't been imported
    console.log("Could not execute picturefill.")
  mapNewWindows()
    

searchParams = new Object()
searchParams.targetApi = "commonnames_api.php"
searchParams.targetContainer = "#result_container"

performSearch = ->
  # Do things
  s = $("#search").val()
  if isNull(s)
    $("#search-status").attr("text","Please enter a search term.")
    $("#search-status")[0].show()
    return false
  console.log("Got search value #{s}")
  args = "q=#{s}"
  $.post(searchParams.targetApi,args,"json")
  .done (result) ->
    # Populate the result container
    console.log("Search executed by #{result.method} with #{result.count} results.")
    if result.status is true
      formatSearchResults(result)
      return false
    $("#search-status").attr("text",result.human_error)
    $("#search-status")[0].show()
    console.error(result.error)
    console.warn(result)
  .fail (result,error) ->
    console.error("There was an error performing the search")
    console.warn(result,error,result.statusText)
    error = "#{result.status} - #{result.statusText}"
    $("#search-status").attr("text","Couldn't execute the search - #{error}")
    $("#search-status")[0].show()
  .always ->
    # Anything we always want done
    false

formatSearchResults = (result,container = searchParams.targetContainer) ->
  data = result.result
  searchParams.result = data
  headers = new Array()
  html = ""
  htmlHead = "<table>\n\t<tr>"
  htmlClose = "</table>"
  $.each data, (i,row) ->
    if i is 0
      j = 0
      $.each row, (k,v) ->
        htmlHead += "\n\t\t<th>#{k}</th>"
        j++
        if j is Object.size(row)
          htmlHead += "\n\t</tr>"
    htmlRow = "\n\t<tr id='cndb-row#{i}'>"
    l = 0
    $.each row, (k,col) ->
      htmlRow += "\n\t\t<td id='#{k}-#{i}'>#{col}</td>"
      l++
      if l is Object.size(row)
        htmlRow += "\n\t</tr>"
        html += htmlRow
    if i is Object.size(data)
      html = htmlHead + html + htmlClose
      console.log("Processed #{i} rows")
      $(container).html(html)

sortResults = (by_column) ->
  # Somethign clever -- look at each of the by_column points, then
  # throw those into an array and sort those, using their index as a
  # map to data and re-mapping data by those orders. May need to use
  # the index of a duplicated array as the reference - walk through
  # sorted and lookup position in reference, then data[index] = data[ref_pos]
  data = searchParams.result

$ ->
  # Do bindings
  console.log("Doing onloads ...")
  $("#search_form").submit (e) ->
    e.preventDefault()
    performSearch()
  $("#do-search").click ->
    performSearch()
  # Do a fill of the result container
  $.post(searchParams.targetApi,"","json")
  .done (result) ->
    # Populate the result container
    if result.status is true
      formatSearchResults(result)
      return false
    $("#search-status").attr("text",result.human_error)
    $("#search-status")[0].show()
    console.error(result.error)
    console.warn(result)
  .fail (result,error) ->
    console.error("There was an error loading the generic table")
    console.warn(result,error,result.statusText)
    error = "#{result.status} - #{result.statusText}"
    $("#search-status").attr("text","Couldn't load table - #{error}")
    $("#search-status")[0].show()
  .always ->
    # Anything we always want done
    $("#search").attr("disabled",false)
    false
  
