searchParams = new Object()
searchParams.targetApi = "commonnames_api.php"
searchParams.targetContainer = "#result_container"

performSearch = () ->
  # Do things
  s = $("#search").val()
  args = "q=#{s}"
  $.post(searchParams.targetApi,args,"json")
  .done (result) ->
    # Populate the result container
    false
  .fail (result,error) ->
    console.error("There was an error performing the search")
    console.warn(result,error,result.errorMessage)
  .always ->
    # Anything we always want done
    false

$ ->
  # Do bindings
  $("#search_form").submit (e) ->
    e.preventDefault()
    performSearch()
