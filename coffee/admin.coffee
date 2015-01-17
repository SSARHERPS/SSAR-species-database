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
      $("article").html("<h3>Welcome, #{$.cookie("ssarherps_name")} <paper-icon-button icon='settings-applications' class='click' data-url='#{data.login_url}'></paper-icon-button></h3><div id='admin-actions-block'></div>")
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


lookupEditorSpecies = ->
  ###
  # Lookup a given species and load it for editing
  ###
  false

saveEditorEntry = ->
  ###
  # Send an editor state along with login credentials,
  # and report the save result back to the user
  ###
  false

$ ->
  try
    checkAdmin()
    if adminParams.loadAdminUi is true
      loadAdminUi()
  catch e
    console.warn("This page does not have the criteria to check administration")
