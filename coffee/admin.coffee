###
# The main coffeescript file for administrative stuff
###

adminParams.loginPage = "admin-login.php"
adminParams.apiTarget = "admin_api.php"

loadAdminUi = ->
  ###
  # Main wrapper function. Checks for a valid login state, then
  # fetches/draws the page contents if it's OK. Otherwise, boots the
  # user back to the login page.
  ###
  false

$ ->
  if window.loadAdminUi is true
    loadAdminUi()
