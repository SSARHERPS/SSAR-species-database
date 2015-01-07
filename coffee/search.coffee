searchParams = new Object()
searchParams.targetApi = "commonnames_api.php"
searchParams.targetContainer = "#result_container"
searchParams.apiPath = uri.urlString + searchParams.targetApi

performSearch = (stateArgs = undefined) ->
  if not stateArgs?
    s = $("#search").val()
    # Store a version before we do any search modifiers
    sOrig = s
    if isNull(s)
      $("#search-status").attr("text","Please enter a search term.")
      $("#search-status")[0].show()
      return false

    if $("#strict-search").polymerSelected() isnt true
      s = s.toLowerCase()
      s = "#{prepURI(s)}&loose=true"
    else
      s = prepURI(s)
    args = "q=#{s}"
  else
    args = "q=#{stateArgs}"
    sOrig = stateArgs.split("&")[0]
  animateLoad()
  console.log("Got search value #{s}, hitting","#{searchParams.apiPath}?#{args}")
  $.get(searchParams.targetApi,args,"json")
  .done (result) ->
    # Populate the result container
    console.log("Search executed by #{result.method} with #{result.count} results.")
    if toInt(result.count) is 0
      $("#search-status").attr("text","\"#{sOrig}\" returned no results.")
      $("#search-status")[0].show()
      stopLoadError()
      return false
    if result.status is true
      formatSearchResults(result)
      return false
    $("#search-status").attr("text",result.human_error)
    $("#search-status")[0].show()
    console.error(result.error)
    console.warn(result)
    stopLoadError()
  .fail (result,error) ->
    console.error("There was an error performing the search")
    console.warn(result,error,result.statusText)
    error = "#{result.status} - #{result.statusText}"
    $("#search-status").attr("text","Couldn't execute the search - #{error}")
    $("#search-status")[0].show()
    stopLoadError()
  .always ->
    # Anything we always want done
    if s? then setHistory("#{uri.urlString}##{s}")
    false

formatSearchResults = (result,container = searchParams.targetContainer) ->
  data = result.result
  searchParams.result = data
  headers = new Array()
  html = ""
  htmlHead = "<table id='cndb-result-list'>\n\t<tr class='cndb-row-headers'>"
  htmlClose = "</table>"
  # We start at 0, so we want to count one below
  targetCount = toInt(result.count)-1
  $.each data, (i,row) ->
    if toInt(i) is 0
      j = 0
      htmlHead += "\n<!-- Table Headers -->"
      $.each row, (k,v) ->
        niceKey = k.replace(/_/g," ")
        if niceKey isnt "id" #and niceKey isnt "image"
          if $("#show-deprecated").polymerSelected() isnt true
            alt = "deprecated_scientific"
          else
            # Empty placeholder
            alt = ""
          if k isnt alt
            htmlHead += "\n\t\t<th class='text-center'>#{niceKey}</th>"
        j++
        if j is Object.size(row)
          htmlHead += "\n\t</tr>"
          htmlHead += "\n<!-- End Table Headers -->"
    htmlRow = "\n\t<tr id='cndb-row#{i}' class='cndb-result-entry'>"
    l = 0
    $.each row, (k,col) ->
      if k isnt "id" #and k isnt "image"
        if k is "authority_year"
          try
            d = JSON.parse(col)
            genus = Object.keys(d)[0]
            species = d[genus]
            col = "G: #{genus}<br/>S: #{species}"
          catch e
            # Render as-is
            d = col
        if $("#show-deprecated").polymerSelected() isnt true
          alt = "deprecated_scientific"
        else
          # Empty placeholder
          alt = ""
        if k isnt alt
          if k is "image"
            if isNull(col)
              # Get a CalPhotos link as
              # http://calphotos.berkeley.edu/cgi/img_query?rel-taxon=contains&where-taxon=batrachoseps+attenuatus
              taxonQuery = "#{row.genus}+#{row.species}"
              if not isNull(row.subspecies)
                taxonQuery = "#{taxonQuery}+#{row.subspecies}"
              col = "<paper-icon-button icon='launch' data-href='http://calphotos.berkeley.edu/cgi/img_query?rel-taxon=contains&where-taxon=#{taxonQuery}' class='newwindow calphoto' data-taxon=\"#{taxonQuery}\"></paper-icon-button>"
            else
              col = "<paper-icon-button icon='image:image' data-lightbox='#{col}' class='lightboximage'></paper-icon-button>"
          htmlRow += "\n\t\t<td id='#{k}-#{i}' class='#{k}'>#{col}</td>"
      l++
      if l is Object.size(row)
        htmlRow += "\n\t</tr>"
        html += htmlRow
    # Check if we're done
    if toInt(i) is targetCount
      html = htmlHead + html + htmlClose
      console.log("Processed #{toInt(i)+1} rows")
      $(container).html(html)
      mapNewWindows()
      lightboxImages()
      $("#result-count").text(" - #{result.count} entries")
      stopLoad()
      # Lazy-replace linkout calphotos with images. Each one needs a hit!
      # deferCalPhotos()

deferCalPhotos = (selector = ".calphoto") ->
  ###
  # Defer renders of calphoto linkouts
  # Hit targets of form
  # http://calphotos.berkeley.edu/cgi-bin/img_query?getthumbinfo=1&num=all&taxon=Acris+crepitans&format=xml
  ###
  count = $(selector).length
  cpUrl = "http://calphotos.berkeley.edu/cgi-bin/img_query"
  i = 0
  $(selector).each ->
    i++
    thisLinkout = $(this)
    taxon = thisLinkout.attr("data-taxon")
    args = "getthumbinfo=1&num=all&cconly=1&taxon=#{taxon}&format=xml"
    $.get(cpUrl,args)
    .done (resultXml) ->
      result = xmlToJSON.parseString(resultXml)
      data = result.xml.calphotos
      thumb = data.thumb_url
      large = data.enlarge_jpeg_url
      link = data.enlarge_url
      # Render a thumbnail that onclick will lightbox
      html = "<a href='#{large}' class='calphoto-img-anchor'><img src='#{thumb}' data-href='#{link}' class='calphoto-img-thumb' data-taxon='#{taxon}'/></a>"
      thisLinkout.replaceWith(html)
      false
    .fail (result,status) ->
      false
    .always ->
      if i is count
        lightboxImages(".calphoto-image-anchor")
  false

sortResults = (by_column) ->
  # Somethign clever -- look at each of the by_column points, then
  # throw those into an array and sort those, using their index as a
  # map to data and re-mapping data by those orders. May need to use
  # the index of a duplicated array as the reference - walk through
  # sorted and lookup position in reference, then data[index] = data[ref_pos]
  data = searchParams.result

setHistory = (url = "#",state = null, title = null) ->
  ###
  # Set up the history to provide something linkable
  ###
  history.pushState(state,title,url)
  # Rewrite the query URL
  uri.query = $.url(url).attr("fragment")
  false

$ ->
  # Do bindings
  console.log("Doing onloads ...")
  animateLoad()
  # Set up popstate
  window.addEventListener "popstate", (e) ->
    uri.query = $.url().attr("fragment")
    console.log("Popping state to #{uri.query}")
    performSearch(uri.query)
  ## Set events
  $("#search_form").submit (e) ->
    e.preventDefault()
    performSearch()
  # Bind enter keydown
  $("#search_form").keypress (e) ->
    if e.which is 13 then performSearch()
  $("#do-search").click ->
    performSearch()
  # Do a fill of the result container
  if isNull uri.query
    loadArgs = ""
  else
    loadArgs = uri.query
  console.log("Doing initial search with '#{loadArgs}', hitting","#{searchParams.apiPath}?q=#{loadArgs}")
  $.get(searchParams.targetApi,"q=#{loadArgs}","json")
  .done (result) ->
    # Populate the result container
    if result.status is true and result.count > 0
      console.log("Got a valid result, formatting #{result.count} results.")
      formatSearchResults(result)
      return false
    if result.count is 0
      result.human_error = "No results for \"#{loadArgs.split("&")[0]}\""
    $("#search-status").attr("text",result.human_error)
    $("#search-status")[0].show()
    console.error(result.error)
    console.warn(result)
    stopLoadError()
  .fail (result,error) ->
    console.error("There was an error loading the generic table")
    console.warn(result,error,result.statusText)
    error = "#{result.status} - #{result.statusText}"
    $("#search-status").attr("text","Couldn't load table - #{error}")
    $("#search-status")[0].show()
    stopLoadError()
  .always ->
    # Anything we always want done
    $("#search").attr("disabled",false)
    false
