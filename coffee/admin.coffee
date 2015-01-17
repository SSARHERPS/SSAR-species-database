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
  verifyLoginCredentials ->
    # Post verification
    $("article").html("<h1>SSAR CNDB Administration</h1><h3>Welcome, #{$.cookie("ssarherps_name")}</h3><div id='admin-actions-block'></div>")
    false
  $("article").html("<h1>Script loaded</h1>")
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
      callback()
    else
      goTo(result.login_url)
  .fail (result,status) ->
    # Throw up some warning here
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
