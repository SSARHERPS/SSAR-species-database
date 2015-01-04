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
  htmlHead = "<table id='cndb-result-list'>\n\t<tr class='cndb-row-headers'>"
  htmlClose = "</table>"
  targetCount = toInt(result.count)-1
  $.each data, (i,row) ->
    if toInt(i) is 0
      j = 0
      htmlHead += "\n<!-- Table Headers -->"
      console.log("Row:",row)
      $.each row, (k,v) ->
        console.log(k)
        htmlHead += "\n\t\t<th>#{k}</th>"
        j++
        if j is Object.size(row)
          htmlHead += "\n\t</tr>"
          htmlHead += "\n<!-- End Table Headers -->"
    htmlRow = "\n\t<tr id='cndb-row#{i}' class='cndb-result-entry'>"
    l = 0
    $.each row, (k,col) ->
      htmlRow += "\n\t\t<td id='#{k}-#{i}' class='#{k}'>#{col}</td>"
      l++
      if l is Object.size(row)
        htmlRow += "\n\t</tr>"
        html += htmlRow
    # Check if we're done
    if toInt(i) is targetCount
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
      console.log("Got a valid result, formatting #{result.count} results.")
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
