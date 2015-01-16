###
# The main coffeescript file for administrative stuff
# Triggered from admin-page.html
###
adminParams = new Object()
adminParams.loginPage = "admin-login.php"
adminParams.apiTarget = "admin_api.php"

loadAdminUi = ->
  ###
  # Main wrapper function. Checks for a valid login state, then
  # fetches/draws the page contents if it's OK. Otherwise, boots the
  # user back to the login page.
  ###
  verifyLoginCredentials ->
    # Post verification
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
  if window.loadAdminUi is true
    loadAdminUi()
