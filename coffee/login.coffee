# Login functions

passwords = new Object()
passwords.goodbg = "#cae682"
passwords.badbg = "#e5786d"
passwords.minLength ?= 8
passwords.overrideLength ?= 21

checkPasswordLive = ->
  pass = $("#password").val()
  # The 8 should be passwords.minLength
  if pass.length >passwords.overrideLength or pass.match(/^(?:(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$)$/)
    $("#password").css("background",passwords.goodbg)
    passwords.basepwgood = true
  else
    $("#password").css("background",passwords.badbg)
    passwords.basepwgood = false
  evalRequirements()
  if not isNull($("#password2").val()) then checkMatchPassword()
  toggleNewUserSubmit()
  return false

checkMatchPassword = ->
  if $("#password").val() is $("#password2").val()
    $('#password2').css('background', passwords.goodbg)
    passwords.passmatch = true
  else
    $('#password2').css('background', passwords.badbg)
    passwords.passmatch = false
  toggleNewUserSubmit()
  return false

toggleNewUserSubmit = ->
  try
    dbool = not(passwords.passmatch && passwords.basepwgood)
    $("#createUser_submit").attr("disabled",dbool)
  catch e
    passwords.passmatch = false
    passwords.basepwgood = false

evalRequirements = ->
  unless $("#strength-meter").exists()
    html = "<div id='strength-meter'><div id='strength-requirements'><div id='strength-alpha'><p class='label'>a</p><div class='strength-eval'></div></div><div id='strength-alphacap'><p class='label'>A</p><div class='strength-eval'></div></div><div id='strength-numspecial'><p class='label'>1/!</p><div class='strength-eval'></div></div></div><div id='strength-bar'><label for='password-strength'>Strength: </label><progress id='password-strength' max='5'></progress></div></div>"
    $("#login .right").prepend(html)
  pass = $("#password").val()
  pstrength = zxcvbn(pass)
  $(".strength-eval").css("background",passwords.badbg)
  if pass.length > 20 then $(".strength-eval").css("background",passwords.goodbg)
  else
    if pass.match(/^(?:((?=.*\d)|(?=.*\W+)).*$)$/) then $("#strength-numspecial .strength-eval").css("background",passwords.goodbg)
    if pass.match(/^(?=.*[a-z]).*$/) then $("#strength-alpha .strength-eval").css("background",passwords.goodbg)
    if pass.match(/^(?=.*[A-Z]).*$/) then $("#strength-alphacap .strength-eval").css("background",passwords.goodbg)
  $("#password-strength").attr("value",pstrength.score+1);

doEmailCheck = ->
  # Perform a GET request to see if the chosen email is already taken

doTOTPSubmit = () ->
  # Get the code from #totp_code and push it through
  # to async_login_handler.php , get the results and behave appropriately
  event.preventDefault()
  animateLoad()
  code = $("#totp_code").val()
  user = $("#username").val()
  url = $.url()
  ajaxLanding = "async_login_handler.php"
  urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + ajaxLanding
  args = "action=verifytotp&code=#{code}&user=#{user}"
  totp = $.post(urlString + ajaxLanding,args,'json')
  totp.done (result) ->
    # Check the result
    if result.status is true
      # If it's good, set the cookies
      $("#totp_message")
      .text("Correct!")
      .removeClass("error")
      .addClass("good")
      expires = result.expires
      i = 0
      $.each result.raw_cookie (key,val) ->
        $.cookie(key,val,expires)
        i++
        if i is Object.size(result.raw_cookie)
          # Take us home
          home = url.attr('protocol') + '://' + url.attr('host') + '/'
          stopLoad()
          window.location home
    else
      $("#totp_message").text(result.human_error)
      $("#totp_code").val("") # Clear it
      $("#totp_code").focus()
      stopLoadError()
  totp.fail (result,status) ->
    # Be smart about the failure
    $("#totp_message").text("Failed to contact server. Please try again.")
    stopLoadError()

doTOTPRemove = ->
  # Remove 2FA
  event.preventDefault()

makeTOTP = ->
  # Create 2FA for the user
  event.preventDefault()

$ ->
  $("#password")
  .keypress ->
    checkPasswordLive()
  .change ->
    checkPasswordLive()
  .keyup ->
    checkPasswordLive()
  $("#password2")
  .keypress ->
    checkMatchPassword()
  .change ->
    checkMatchPassword()
  .keyup ->
    checkMatchPassword()
