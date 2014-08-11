searchParams = new Object()
searchParams.targetApi = "cndb/commonnames_api.php"
searchParams.targetContainer = "#result_container"

performSearch = () ->
  # Do things
  s = $("#search").val()
  console.log("Got search value #{s}")
  args = "q=#{s}"
  $.post(searchParams.targetApi,args,"json")
  .done (result) ->
    # Populate the result container
    false
  .fail (result,error) ->
    console.error("There was an error performing the search")
    console.warn(result,error,result.errorMessage)
    error = "#{result.status} - #{result.statusText}"
    $("#search-status").attr("text","Couldn't execute the search - #{error}")
    $("#search-status")[0].show()
  .always ->
    # Anything we always want done
    false

$ ->
  # Do bindings
  console.log("Doing onloads ...")
  $("#search_form").submit (e) ->
    e.preventDefault()
    performSearch()
  $("#do-search").click ->
    performSearch()
