searchParams = new Object()
searchParams.targetApi = "cndb/commonnames_api.php"
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
  
