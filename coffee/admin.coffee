###
# The main coffeescript file for administrative stuff
# Triggered from admin-page.html
###
adminParams = new Object()
adminParams.apiTarget = "admin_api.php"
adminParams.loginDir = "admin/"
adminParams.loginApiTarget = "#{adminParams.loginDir}async_login_handler.php"

loadAdminUi = ->
  ###
  # Main wrapper function. Checks for a valid login state, then
  # fetches/draws the page contents if it's OK. Otherwise, boots the
  # user back to the login page.
  ###
  try
    verifyLoginCredentials (data) ->
      # Post verification
      $("article").html("<h3>Welcome, #{$.cookie("ssarherps_name")} <paper-icon-button icon='settings-applications' class='click' data-url='#{data.login_url}'></paper-icon-button></h3><div id='admin-actions-block'><div class='bs-callout bs-callout-info'><p>Please be patient while the administrative interface loads.</p></div></div>")
      ###
      # Render out the admin UI
      # We want a search box that we pipe through the API
      # and display the table out for editing
      ###
      searchForm = "<form id=\"admin-search-form\" onsubmit=\"event.preventDefault()\">\n\t<div>\n\t\t<paper-input label=\"Search for species\" id=\"admin-search\" name=\"admin-search\" required autofocus floatingLabel class=\"col-xs-7 col-sm-8\"></paper-input>\n\t\t<paper-fab id=\"do-admin-search\" icon=\"search\" raisedButton class=\"materialblue\"></paper-fab>\n\t</div>\n</form><div id='search-results'></div>"
      $("#admin-actions-block").html(searchForm)
      $("#admin-search-form").submit (e) ->
        e.preventDefault()
      $("#admin-search").keypress (e) ->
        if e.which is 13 then renderAdminSearchResults()
      $("#do-admin-search").click ->
        renderAdminSearchResults()
      false
  catch e
    $("article").html("<div class='bs-callout bs-callout-danger'><h4>Application Error</h4><p>There was an error in the application. Please refresh and try again. If this persists, please contact administration.</p></div>")
  false


verifyLoginCredentials = (callback) ->
  ###
  # Checks the login credentials against the server.
  # This should not be used in place of sending authentication
  # information alongside a restricted action, as a malicious party
  # could force the local JS check to succeed.
  # SECURE AUTHENTICATION MUST BE WHOLLY SERVER SIDE.
  ###
  hash = $.cookie("ssarherps_auth")
  secret = $.cookie("ssarherps_secret")
  link = $.cookie("ssarherps_link")
  args = "hash=#{hash}&secret=#{secret}&dblink=#{link}"
  $.post(adminParams.loginApiTarget,args,"json")
  .done (result) ->
    if result.status is true
      callback(result)
    else
      goTo(result.login_url)
  .fail (result,status) ->
    # Throw up some warning here
    $("article").html("<div class='bs-callout-danger bs-callout'><h4>Couldn't verify login</h4><p>There's currently a server problem. Try back again soon.</p>'</div>")
    console.log(result,status)
    false
  false


renderAdminSearchResults = (containerSelector = "#search-results") ->
  ###
  # Takes parts of performSearch() but only in the admin context
  ###
  s = $("#admin-search").val()
  if isNull(s)
    toastStatusMessage("Please enter a search term")
    return false
  animateLoad()
  $("#admin-search").blur()
  # Remove periods from the search
  s = s.replace(/\./g,"")
  s = prepURI(s)
  args = "q=#{s}&loose=true"
  $.get(searchParams.targetApi,args,"json")
  .done (result) ->
    if result.status isnt true
      toastStatusMessage(result.human_error)
      return false
    # Now, take the results and format them
    data = result.result
    html = ""
    htmlHead = "<table id='cndb-result-list' class='table table-striped table-hover'>\n\t<tr class='cndb-row-headers'>"
    htmlClose = "</table>"
    # We start at 0, so we want to count one below
    targetCount = toInt(result.count)-1
    colClass = null
    bootstrapColCount = 0
    $.each data, (i,row) ->
      if toInt(i) is 0
        j = 0
        htmlHead += "\n<!-- Table Headers - #{Object.size(row)} entries -->"
        $.each row, (k,v) ->
          niceKey = k.replace(/_/g," ")
          if k is "genus" or k is "species" or k is "subspecies"
            htmlHead += "\n\t\t<th class='text-center'>#{niceKey}</th>"
            bootstrapColCount++
          j++
          if j is Object.size(row)
            htmlHead += "\n\t\t<th class='text-center'>Edit</th>\n\t</tr>"
            bootstrapColCount++
            htmlHead += "\n<!-- End Table Headers -->"
            console.log("Got #{bootstrapColCount} display columns.")
            bootstrapColSize = roundNumber(12/bootstrapColCount,0)
            colClass = "col-md-#{bootstrapColSize}"
      taxonQuery = "#{row.genus}+#{row.species}"
      if not isNull(row.subspecies)
        taxonQuery = "#{taxonQuery}+#{row.subspecies}"
      htmlRow = "\n\t<tr id='cndb-row#{i}' class='cndb-result-entry' data-taxon=\"#{taxonQuery}\">"
      l = 0
      $.each row, (k,col) ->
        if isNull(row.genus)
          # Next iteration
          return true
        if k is "genus" or k is "species" or k is "subspecies"
          htmlRow += "\n\t\t<td id='#{k}-#{i}' class='#{k} #{colClass}'>#{col}</td>"
        l++
        if l is Object.size(row)
          htmlRow += "\n\t\t<td id='#{k}-#{i}' class='edit-taxon #{colClass} text-center'><paper-icon-button icon='image:edit' class='edit' data-taxon='#{taxonQuery}'></paper-icon-button></td>"
          htmlRow += "\n\t</tr>"
          html += htmlRow
      if toInt(i) is targetCount
        html = htmlHead + html + htmlClose
        $(containerSelector).html(html)
        console.log("Processed #{toInt(i)+1} rows")
        $(".edit").click ->
          taxon = $(this).attr('data-taxon')
          lookupEditorSpecies(taxon)
        stopLoad()
  .fail (result,status) ->
    console.error("There was an error performing the search")
    console.warn(result,error,result.statusText)
    error = "#{result.status} - #{result.statusText}"
    $("#search-status").attr("text","Couldn't execute the search - #{error}")
    $("#search-status")[0].show()
    stopLoadError()

lookupEditorSpecies = (taxon = undefined) ->
  ###
  # Lookup a given species and load it for editing
  ###
  animateLoad()
  if not $("#modal-taxon-edit").exists()
    html = "<paper-action-dialog backdrop layered closeSelector=\"[dismissive]\" id='modal-taxon-edit'><div id='modal-taxon-editor'></div><paper-button dismissive>Cancel</paper-button><paper-button affirmative>Save</paper-button></paper-action-dialog>"
    $("#search-results").after(html)
  foo()

saveEditorEntry = ->
  ###
  # Send an editor state along with login credentials,
  # and report the save result back to the user
  ###
  foo()

foo = ->
  toastStatusMessage("Sorry, this feature is not yet finished")
  stopLoad()
  false

$ ->
  try
    checkAdmin()
    if adminParams.loadAdminUi is true
      loadAdminUi()
  catch e
    console.warn("This page does not have the criteria to check administration")
