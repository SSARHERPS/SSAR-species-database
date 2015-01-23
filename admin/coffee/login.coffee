# Login functions

if typeof window.passwords isnt 'object' then window.passwords = new Object()
window.passwords.goodbg = "#cae682"
window.passwords.badbg = "#e5786d"
# Password lengths can be overriden in CONFIG.php,
# which then defines the values for these before the script loads.
window.passwords.minLength ?= 8
window.passwords.overrideLength ?= 20

if typeof window.totpParams isnt 'object' then window.totpParams = new Object()
window.totpParams.popClass = "pop-panel"
# The value $redirect_url in CONFIG.php overrides this value
if not window.totpParams.home?
  url = $.url()
  window.totpParams.home =  url.attr('protocol') + '://' + url.attr('host') + '/'
if not window.totpParams.relative?
  window.totpParams.relative = ""
if not window.totpParams.subdirectory?
  window.totpParams.subdirectory = ""
window.totpParams.mainStylesheetPath = window.totpParams.relative+"css/otp_styles.css"
window.totpParams.popStylesheetPath = window.totpParams.relative+"css/otp_panels.css"
window.totpParams.combinedStylesheetPath = window.totpParams.relative+"css/otp.min.css"

checkPasswordLive = (selector = "#createUser_submit") ->
  pass = $("#password").val()
  re = new RegExp("^(?:(?=^.{#{window.passwords.minLength},}$)((?=.*\\d)|(?=.*\\W+))(?![.\\n])(?=.*[A-Z])(?=.*[a-z]).*$)$")
  if pass.length >window.passwords.overrideLength or pass.match(re)
    $("#password").css("background",window.passwords.goodbg)
    window.passwords.basepwgood = true
  else
    $("#password").css("background",window.passwords.badbg)
    window.passwords.basepwgood = false
  evalRequirements()
  if not isNull($("#password2").val())
    checkMatchPassword(selector)
    toggleNewUserSubmit(selector)
  return false

checkMatchPassword = (selector = "#createUser_submit") ->
  if $("#password").val() is $("#password2").val()
    $('#password2').css('background', window.passwords.goodbg)
    window.passwords.passmatch = true
  else
    $('#password2').css('background', window.passwords.badbg)
    window.passwords.passmatch = false
  toggleNewUserSubmit(selector)
  return false

toggleNewUserSubmit = (selector = "#createUser_submit") ->
  try
    dbool = not(window.passwords.passmatch && window.passwords.basepwgood)
    $("#createUser_submit").attr("disabled",dbool)
  catch e
    window.passwords.passmatch = false
    window.passwords.basepwgood = false

evalRequirements = ->
  unless $("#strength-meter").exists()
    html = "<div id='strength-meter'><div id='strength-requirements'><p style='float:left;margin-top:2em'>Character Classes:</p><div id='strength-alpha'><p class='label'>a</p><div class='strength-eval'></div></div><div id='strength-alphacap'><p class='label'>A</p><div class='strength-eval'></div></div><div id='strength-numspecial'><p class='label'>1/!</p><div class='strength-eval'></div></div></div><div id='strength-bar'><label for='password-strength'>Strength: </label><progress id='password-strength' max='5'></progress><p>Time to crack: <span id='crack-time'></span></p></div></div>"
    notice = "<p><small>We require a password of at least #{window.passwords.minLength} characters with at least one upper case letter, at least one lower case letter, and at least one digit or special character. You can also use <a href='http://imgs.xkcd.com/comics/password_strength.png'>any long password</a> of at least #{window.passwords.overrideLength} characters, with no security requirements.</small></p>"
    $("#password_security").html(html + notice)
  pass = $("#password").val()
  pstrength = zxcvbn(pass)
  green_channel = (toInt(pstrength.score)+1) * 51
  red_channel = 255 - toInt(Math.pow(pstrength.score,2) * 16)
  if red_channel < 0 then red_channel = 0
  new_end = "rgb(#{red_channel},#{green_channel},0)"
  webkit_css = "\nprogress[value]::-webkit-progress-value {
    background: -webkit-linear-gradient(left,rgb(255,0,30),#{new_end}),
    -webkit-linear-gradient(top,rgba(255, 255, 255, .5),
	                           rgba(0, 0, 0, .5));
                             }"
  moz_css = "\nprogress::-moz-progress-bar {
    background: -moz-linear-gradient(left,rgb(255,0,30),#{new_end}),
    -moz-linear-gradient(top,rgba(255, 255, 255, .5),
	                           rgba(0, 0, 0, .5));
                             }"
  if not $("#dynamic").exists()
    $("<style type='text/css' id='dynamic' />").appendTo("head")
  $("#dynamic").text(webkit_css + moz_css)
  $(".strength-eval").css("background",window.passwords.badbg)
  if pass.length >= window.passwords.overrideLength then $(".strength-eval").css("background",window.passwords.goodbg)
  else
    if pass.match(/^(?:((?=.*\d)|(?=.*\W+)).*$)$/) then $("#strength-numspecial .strength-eval").css("background",window.passwords.goodbg)
    if pass.match(/^(?=.*[a-z]).*$/) then $("#strength-alpha .strength-eval").css("background",window.passwords.goodbg)
    if pass.match(/^(?=.*[A-Z]).*$/) then $("#strength-alphacap .strength-eval").css("background",window.passwords.goodbg)
  $("#password-strength").attr("value",pstrength.score+1);
  $("#crack-time").text(pstrength.crack_time_display)

doEmailCheck = ->
  # Perform a GET request to see if the chosen email is already taken

doTOTPSubmit = (home = window.totpParams.home) ->
  # Get the code from #totp_code and push it through
  # to async_login_handler.php , get the results and behave appropriately
  noSubmit()
  animateLoad()
  code = $("#totp_code").val()
  user = $("#username").val()
  pass = $("#password").val()
  ip = $("#remote").val()
  url = $.url()
  ajaxLanding = "async_login_handler.php"
  urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + window.totpParams.subdirectory + ajaxLanding
  args = "action=verifytotp&code=#{code}&user=#{user}&password=#{pass}&remote=#{ip}"
  totp = $.post(urlString ,args,'json')
  totp.done (result) ->
    # Check the result
    if result.status is true
      # If it's good, set the cookies
      try
        $("#totp_message")
        .text("Correct!")
        .removeClass("error")
        .addClass("good")
        i = 0
        $.each result["cookies"].raw_cookie, (key,val) ->
          try
            $.cookie(key,val,result["cookies"].expires)
          catch e
            console.error("Couldn't set cookies",result["cookies"].raw_cookie)
          i++
          if i is Object.size(result["cookies"].raw_cookie)
            # Take us home
            home ?= url.attr('protocol') + '://' + url.attr('host') + '/'
            stopLoad()
            delay 500, ->
              window.location.href = home
      catch e
        console.error("Unexpected error while validating",e.message);
    else
      $("#totp_message")
      .text(result.human_error)
      .addClass("error")
      $("#totp_code").val("") # Clear it
      $("#totp_code").focus()
      stopLoadError()
      console.error("Invalid code error",result.error,result);
  totp.fail (result,status) ->
    # Be smart about the failure
    $("#totp_message")
    .text("Failed to contact server. Please try again.")
    .addClass("error")
    console.error("AJAX failure",urlString  + "?" + args,result,status)
    stopLoadError()

doTOTPRemove = ->
  # Remove 2FA
  noSubmit()
  animateLoad()
  user = $("#username").val()
  pass = encodeURIComponent($("#password").val())
  code = $("#code").val()
  url = $.url()
  ajaxLanding = "async_login_handler.php"
  urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + window.totpParams.subdirectory + ajaxLanding
  args = "action=removetotp&code=#{code}&username=#{user}&password=#{pass}&base64=true"
  remove_totp = $.post(urlString,args,'json')
  remove_totp.done (result) ->
    # Check the result
    unless result.status is true
      $("#totp_message")
      .text(result.human_error)
      .addClass("error")
      console.error(result.error)
      console.warn("#{urlString}?#{args}")
      console.warn(result)
      stopLoadError()
      return false
    # Removed!
    $("#totp_message")
    .removeClass('error')
    .addClass('good')
    .text("Two-factor authentication removed for #{result.username}.")
    $("#totp_remove").remove()
    console.log(urlString + "?" + args);
    console.log(result)
    stopLoad()
    return false
  remove_totp.fail (result,status) ->
    # Be smart about the failure
    $("#totp_message")
    .text("Failed to contact server. Please try again.")
    .addClass("error")
    console.error("AJAX failure",urlString  + "?" + args,result,status)
    stopLoadError()

makeTOTP = ->
  # Create 2FA for the user
  noSubmit()
  animateLoad()
  # Call up the function, and replace #totp_add with a new form to verify
  user = $("#username").val()
  password = $("#password").val()
  hash = $("#hash").val()
  key = $("#secret").val()
  url = $.url()
  ajaxLanding = "async_login_handler.php"
  urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + window.totpParams.subdirectory + ajaxLanding
  args = "action=maketotp&password=#{password}&user=#{user}"
  totp = $.post(urlString,args,'json')
  totp.done (result) ->
    # Yay! Replace the form ....
    if result.status is true
      $("#totp_message")
      .html("To continue, scan this barcode with your smartphone authenticator application. <small><a href='#' id='alt_totp_help'>Don't have the app?</a></small>")
      .removeClass("error")
      .addClass("good")
      console.log(result)
      svg = result.svg
      raw = result.raw
      # Name these in variables to avoid user conflicts
      show_secret_id = "show_secret"
      show_alt = "showAltBarcode"
      barcodeDiv = "secretBarcode"
      html = "<form id='totp_verify' onsubmit='event.preventDefault();'>
  <p style='font-weight:bold'>If you're unable to do so, <a href='#' id='#{show_secret_id}'>click here to manually input your key.</a></p>
  <div id='#{barcodeDiv}'>
    #{result.svg}
    <p>Don't see the barcode? <a href='#' id='#{show_alt}' role='button' class='btn btn-link'>Click here</a></p>
  </div>
  <p>Once you've done so, enter the code generated by your app in the field below to verify your setup.</p>
  <fieldset>
    <legend>Confirmation</legend>
    <input type='number' pattern='[0-9]{6}' size='6' maxlength='6' id='code' name='code' placeholder='Code'/>
    <input type='hidden' id='username' name='username' value='#{user}'/>
    <input type='hidden' id='hash' name='hash' value='#{hash}'/>
    <input type='hidden' id='secret' name='secret' value='#{key}'/>
    <button id='verify_totp_button' class='totpbutton'>Verify</button>
  </fieldset>
</form>"
      $("#totp_start").remove()
      $("#totp_message").after(html)
      $("#alt_totp_help").click ->
        showInstructions()
      $("##{show_secret_id}").click ->
        popupSecret(result.human_secret)
      $("##{show_alt}").click ->
        altImg = "<img src='#{result.raw}' alt='TOTP barcode'/>"
        $("#{barcode_div}").html(altImg)
        $("##{show_alt}").remove()
      $("#verify_totp_button").click ->
        noSubmit()
        saveTOTP(key,hash)
      $("#totp_verify").submit ->
        noSubmit()
        saveTOTP(key,hash)
      stopLoad()
    else
      console.error("Couldn't generate TOTP code",urlString  + "?" + args)
      console.warn(result)
      $("#totp_message")
      .text("There was an error generating your code. #{result.message}")
      .addClass("error")
      stopLoadError()
  totp.fail (result,status) ->
    $("#totp_message")
    .text("Failed to contact server. Please try again.")
    .addClass("error")
    console.error("AJAX failure",urlString  + "?" + args,result,status)
    stopLoadError()
  return false

saveTOTP = (key,hash) ->
  noSubmit()
  animateLoad()
  code = $("#code").val()
  hash = $("#hash").val()
  key = $("#secret").val()
  user = $("#username").val()
  url = $.url()
  ajaxLanding = "async_login_handler.php"
  urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + window.totpParams.subdirectory + ajaxLanding
  args = "action=savetotp&secret=#{key}&user=#{user}&hash=#{hash}&code=#{code}"
  totp = $.post(urlString ,args,'json')
  totp.done (result) ->
    # We're done!
    if result.status is true
      html = "<h1>Done!</h1><h2>Write down and save this backup code. Without it, you cannot disable two-factor authentication if you lose your device.</h2><pre id='backup_code'>#{result.backup}</pre><br/><button id='to_home'>Home &#187;</a>"
      $("#totp_add").html(html)
      $("#to_home").click ->
        window.location.href = window.totpParams.home
      stopLoad()
    else
      html = "<p class='error' id='temp_error'>#{result.human_error}</p>"
      unless $("#temp_error").exists()
        $("#verify_totp_button").after(html)
      else
        $("#temp_error").html(html)
      console.error(result.error)
      stopLoadError()
  totp.fail (result,status) ->
    $("#totp_message").text("Failed to contact server. Please try again.")
    console.error("AJAX failure",result,status)
    stopLoadError()

popupSecret = (secret) ->
  # Overlay a pane showing the secret
  # Format it!
  $("<link/>",{
    rel:"stylesheet"
    type:"text/css"
    media:"screen"
    href:window.totpParams.popStylesheetPath
    }).appendTo("head")
  html="<div id='cover_wrapper'><div id='secret_id_panel' class='#{window.totpParams.popClass} cover_content'><p class='close-popup'>X</p><h2>#{secret}</h2></div></div>"
  $("article").after(html)
  $("article").addClass("blur")
  $(".close-popup").click ->
    $("#cover_wrapper").remove()
    $("article").removeClass("blur")

giveAltVerificationOptions = ->
  # Put up an overlay, and ask if the user wants to remove 2FA or get a text
  url = $.url()
  ajaxLanding = "async_login_handler.php"
  urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + window.totpParams.subdirectory + ajaxLanding
  user = $("#username").val()
  args = "action=cansms&user=#{user}"
  remove_id = "remove_totp_link"
  sms_id = "send_totp_sms"
  pane_id = "alt_auth_pane"
  pane_messages = "alt_auth_messages"

  # Is it already there?
  if $("##{pane_id}").exists()
    $("##{pane_id}").toggle("fast")
    return false

  messages = new Object()
  messages.remove = "<a href='#' id='#{remove_id}' role='button' class='btn btn-default'>Remove two-factor authentication</a>"
  # First see if the user can SMS at all before populating the message options

  sms = $.get(urlString,args,'json')
  sms.done (result) ->
    if result[0] is true
      messages.sms = "<a href='#' id='#{sms_id}' role='button' class='btn btn-default'>Send SMS</a>"
    else
      console.warn("Couldn't get a valid result",result,urlString+"?"+args)
    pop_content = ""
    $.each messages,(k,v) ->
      pop_content += v
    html = "<div id='#{pane_id}'><p>#{pop_content}</p><p id='#{pane_messages}'></p></div>"
    # Attach it to DOM
    $("#totp_submit").after(html)
    # Attach event handlers
    $("##{sms_id}").click ->
      # Attempt to send the TOTP
      args = "action=sendtotptext&user=#{user}"
      sms_totp = $.get(urlString,args,'json')
      console.log("Sending message ...",urlString+"?"+args)
      sms_totp.done (result) ->
        if result.status is true
          # Remove the pane and replace totp_message
          $("##{pane_id}").remove()
          $("#totp_message").text(result.message)
        else
          #Place a notice in pane_messages
          $("##{pane_messages}")
          .addClass("error")
          .text(result.human_error)
          console.error(result.error)
      sms_totp.fail (result,status) ->
        console.error("AJAX failure trying to send TOTP text",urlString + "?" + args)
        console.error("Returns:",result,status)
  sms.fail (result,status) ->
    # Just don't populate the thing
    console.error("Could not check SMS-ability",result,status)
  sms.always ->
    $("##{remove_id}").click ->
      html = "\n  <p id='totp_message' class='error'>Are you sure you want to disable two-factor authentication?</p>\n  <form id='totp_remove' onsubmit='event.preventDefault();'>\n    <fieldset>\n      <legend>Remove Two-Factor Authentication</legend>\n      <input type='email' value='#{user}' readonly='readonly' id='username' name='username'/><br/>\n      <input type='password' id='password' name='password' placeholder='Password'/><br/>\n      <input type='text' id='code' name='code' placeholder='Authenticator Code or Backup Code' size='32' maxlength='32' autocomplete='off'/><br/>\n      <button id='remove_totp_button' class='totpbutton btn btn-danger'>Remove Two-Factor Authentication</button>\n    </fieldset>\n  </form>\n"
      $("#totp_prompt")
      .html(html)
      .attr("id","totp_remove_section")
      $("#totp_remove").submit ->
        doTOTPRemove()
      $("#remove_totp_button").click ->
        doTOTPRemove()

verifyPhone = ->
  noSubmit()
  # Verify phone auth status
  url = $.url()
  ajaxLanding = "async_login_handler.php"
  urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + window.totpParams.subdirectory + ajaxLanding
  auth = if $("#phone_auth").val()? then $("#phone_auth").val() else null
  user = $("#username").val()
  args = "action=verifyphone&username=#{user}&auth=#{auth}"
  verifyPhoneAjax = $.get(urlString,args,'json')
  verifyPhoneAjax.done (result) ->
    if result.status is false
      # If key "is_good" isn't true, display the error
      if not $("#phone_verify_message").exists()
        $("#phone").before("<p id='phone_verify_message'></p>")
      if result.is_good is true
        $("#verify_phone_button").remove()
        message = "You've already verified your phone number, thanks!"
        setClass = "good"
      else
        message = result.human_error
        setClass = "error"
        console.error(result.error)
      $("#phone_verify_message")
      .text(message)
      .addClass(setClass)
      if result.fatal is true
        $("#verify_phone_button").attr("disabled",true)
        $("#verify_phone")
        .unbind('submit')
        .attr("onsubmit","")
      return false
    # If status is true, continue
    if result.status is true
      # Create verification field after #username
      if not $("#phone_auth").exists()
        $("#username").after("<br/><input type='text' length='8' name='phone_auth' id='phone_auth' placeholder='Authorization Code'/>")
      if not $("#phone_verify_message").exists()
        $("#phone").before("<p id='phone_verify_message'></p>")
      $("#phone_verify_message").text(result.message)
      # Relabel
      if result.is_good isnt true
        $("#verify_phone_button").text("Confirm")
      else
        $("#phone_auth").remove()
        $("#verify_later").remove()
        $("#verify_phone_button")
        .html("Continue &#187; ")
        .unbind('click')
        .click ->
          window.location.href = window.totpParams.home
    else
      # Something broke
      console.warn("Unexpected condition encountered verifying the phone number",urlString)
      console.log(result)
      return false
  verifyPhoneAjax.fail (result,status) ->
    # Update a status message
    console.error("AJAX failure trying to send phone verification text",urlString + "?" + args)
    console.error("Returns:",result,status)

showInstructions = (path = "help/instructions_pop.html") ->
  $("<link/>",{
    rel:"stylesheet"
    type:"text/css"
    media:"screen"
    href:window.totpParams.popStylesheetPath
    }).appendTo("head")
  # Load the instructions
  $.get window.totpParams.relative+path
  .done (html) ->
    $("article").after(html)
    $("article").addClass("blur")
    # Fill the images
    assetPath = "#{window.totpParams.relative}assets/"
    $(".android").html("<img src='#{assetPath}playstore.png' alt='Google Play Store'/>")
    $(".ios").html("<img src='#{assetPath}appstore.png' alt='iOS App Store'/>")
    $(".wp8").html("<img src='#{assetPath}wpstore.png' alt='Windows Phone Store'/>")
    $(".large_totp_icon").each ->
      newSource = assetPath + $(this).attr("src")
      $(this).attr("src",newSource)
    $(".app_link_container a").addClass("newwindow")
    mapNewWindows()
    $(".close-popup").click ->
      $("article").removeClass("blur")
      $("#cover_wrapper").remove()
  .fail (result,status) ->
    console.error("Failed to load instructions @ #{path}",result,status)

showAdvancedOptions = (domain,has2fa) ->
  advancedListId = "advanced_options_list"
  if $("##{advancedListId}").exists()
    $("##{advancedListId}").toggle("fast")
    return true
  html = "<ul id='#{advancedListId}'>"
  html += "<li><a href='?2fa=t' role='button' class='btn btn-default'>Configure Two-Factor Authentication</a></li>"
  html += "<li><a href='#' id='removeAccount' role='button' class='btn btn-default'>Remove Account</a></li>"
  $("#settings_list").after(html)
  $("#removeAccount").click ->
    removeAccount(this,"#{domain}_user",has2fa)

removeAccount = (caller,cookie_key,has2fa = true) ->
  # We only grab the username from the cookie to prevent any chance
  # that anyone other than the current user is set up
  username = $.cookie(cookie_key)
  removal_button = "remove_acct_button"
  section_id = "remove_account_section"
  tfaBlock = if has2fa then "\n      <input type='text' id='code' name='code' placeholder='Authenticator Code or Backup Code' size='32' maxlength='32' autocomplete='off'/><br/>" else ""
  html = "<section id='#{section_id}'>\n  <p id='remove_message' class='error'>Are you sure you want to remove your account?</p>\n  <form id='account_remove' onsubmit='event.preventDefault();'>\n    <fieldset>\n      <legend>Remove My Account</legend>\n      <input type='email' value='#{username}' readonly='readonly' id='username' name='username'/><br/>\n      <input type='password' id='password' name='password' placeholder='Password'/><br/>#{tfaBlock}\n      <button id='#{removal_button}' class='totpbutton btn btn-danger'>Remove My Account Permanantly</button> <button onclick=\"window.location.href=totpParams.home\" class='btn btn-primary'>Back to Safety</button>\n    </fieldset>\n  </form>\n</section>"
  if $("#login_block").exists()
    $("#login_block").replaceWith(html)
  else
    $(caller).after(html)
  $("##{removal_button}").click ->
    doRemoveAccountAction()
  $("#account_remove").submit ->
    doRemoveAccountAction()

doRemoveAccountAction = ->
  # Actually do the POST and such
  animateLoad()
  url = $.url()
  ajaxLanding = "async_login_handler.php"
  urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + window.totpParams.subdirectory + ajaxLanding
  username = $("#username").val()
  password = $("#password").val()
  code = if $("#code").exists() then $("#code").val() else false
  args = "action=removeaccount&username=#{username}&password=#{password}&code=#{code}"
  $.post(urlString,args,'json')
  .done (result) ->
    if result.status is true
      $("#remove_message").text("Your account has been successfully deleted.")
      # On success, wipe cookies
      $.each $.cookie(), (k,v) ->
        $.removeCookie(k,{ path: '/' })
      delay 3000,->
        window.location.href = window.totpParams.home
      stopLoad()
    else
      $("#remove_message").text("There was an error removing your account. Please try again.")
      console.error("Got an error-result: ",result.error)
      console.warn(urlString + "?" + args,result)
      stopLoadError()
  .fail (result,status) ->
    $("#remove_message")
    .text(result.error)
    .addClass("error")
    $("totp_code").val("")
    console.error("Ajax Failure",urlString + "?" + args,result,status)
    stopLoadError()


noSubmit = ->
  event.preventDefault()
  event.returnValue = false

doAsyncLogin = (uri = "async_login_handler.php", respectRelativePath = true) ->
  noSubmit()
  if respectRelativePath
    urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + window.totpParams.subdirectory + uri
  else
    urlString = uri
  username = $("#username").val()
  password = $("#password").val()
  pass64 = Base64.encodeURI(password)
  args = "action=dologin&username=#{username}&password=#{pass64}&b64=true"
  # Submit and check the login request
  false

doAsyncCreate = ->
  recaptchaResponse = grecaptcha.getResponse()
  if recaptchaResponse.success isnt true
    # Bad CAPTCHA
    $("#createUser_submit").before("<p id='createUser_fail' class='bg-danger'>Sorry, your CAPTCHA was incorrect. Please try again.</p>")
    grecaptcha.reset()
    return false
  $("#createUser_fail").remove()
  # Submit the user creation
  false


resetPassword = ->
  ###
  # Reset the user password
  ###
  # Remove the password field and replace the login button, rebind
  # events
  $("#password").remove()
  $("#login_button").remove()
  html = "<button id='login_button' class='btn btn-danger'>Check User</button>"
  pane_messages = "reset-user-messages"
  $("#login").before("<div id='#{pane_messages}'")
  $("#login").append(html)
  $("##{pane_messages}")
  .addClass("bg-warning")
  .text("Once your password has been reset, your old password will be invalid.")
  resetFormSubmit = ->
    url = $.url()
    ajaxLanding = "async_login_handler.php"
    urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + window.totpParams.subdirectory + ajaxLanding
    user = $("#username").val()
    args = "action=resetpass&username=#{user}"
    multiOptionBinding = (pargs = args) ->
      $(".reset-pass-button").click ->
        method = $(this).attr("data-method")
        pargs = "#{pargs}&method=#{method}"
        # Check it!
        $.post(urlString,pargs,"json")
        .done (result) ->
          if result.status is false
            $("##{pane_messages}")
            .removeClass("bg-warning bg-primary")
            .addClass("bg-danger")
            .text("There was a problem resetting your password. Please try again")
            # Console
          else
            $("##{pane_messages}")
            .removeClass("bg-warning bg-danger")
            .addClass("bg-primary")
            .text("Check your #{method} for your new password. We strongly encourage you to change it!")
          false
        .fail (result,status) ->
          false
        false
      false
    $.get(urlString,args,"json")
    .done (result) ->
      if result.status is false
        # Do stuff based on the action
        $("#username").prop("disabled",true)
        switch result.action
          when "GET_TOTP"
            # Replace and rebind form to get the TOTP value
            # If the user canSMS, then present that as a button option
            usedSms = false
            html = "<div id='start-reset-process'><button id='totp-submit' class='btn btn-primary'>Verify</button></div>"
            $("#login").append(html)
            if result.canSMS
              sms_id = "reset-user-sms-totp"
              text_html = "<button class='btn btn-default' id='#{sms_id}'>Text Code</button>"
              $("#start-reset-process").append(text_html)
              $("##{sms_id}").click ->
                # Attempt to send the TOTP
                smsArgs = "action=sendtotptext&user=#{user}"
                sms_totp = $.get(urlString,smsArgs,'json')
                console.log("Sending message ...",urlString+"?"+args)
                sms_totp.done (result) ->
                  if result.status is true
                    # Alert the user
                    $("##{pane_messages}")
                    .text("Your code has been sent to your registered number.")
                    .removeClass("bg-warning bg-danger")
                    .addClass("bg-primary")
                    usedSms = true
                  else
                    #Place a notice in pane_messages
                    $("##{pane_messages}")
                    .addClass("bg-danger")
                    .text(result.human_error)
                    console.error(result.error)
                sms_totp.fail (result,status) ->
                  $("##{pane_messages}")
                  .addClass("bg-danger")
                  .text("There was a problem sending your text. Please try again.")
                  console.error("AJAX failure trying to send TOTP text",urlString + "?" + args)
                  console.error("Returns:",result,status)
            doTotpSubmission = ->
              totpValue = $("#totp").val()
              args = "#{args}&totp=#{totpValue}"
              # Now draw the thing
              $("#start-reset-process").remove()
              html = ""
              if result.canSMS and usedSms isnt true
                # Show an option to get a text reset password
                html = "<button class='reset-pass-button btn btn-primary' data-method='text'>Text New Password</button>"
                false
              html = "#{html}<button class='reset-pass-button btn btn-primary' data-method='email'>Email New Password</button>"
              $("#login").append(html)
              multiOptionBinding(args)
              false
            $("#totp-submit").click ->
              noSubmit()
              doTotpSubmission()
            $("#login-totp-form").submit ->
              noSubmit()
              doTotpSubmission()
          when "NEED_METHOD"
            # Draw a button to send a text AND button to email
            $("#login_button").remove()
            html = "<button class='reset-pass-button btn btn-primary' data-method='text'>Text New Password</button>"
            html = "#{html}<button class='reset-pass-button btn btn-primary' data-method='email'>Email New Password</button>"
            $("#login").append(html)
            multiOptionBinding()
            false
          when "BAD_USER"
            # Bad user
            $("##{pane_messages}")
            .addClass("bg-danger")
            .text("Sorry, that user doesn't exist.")
            $("#username")
            .prop("disabled",false)
            .val("")
            false
      # Otherwise, it's good, and an email has been sent
      $("##{pane_messages}")
      .removeClass("bg-warning")
      .addClass("bg-primary")
      .text("Check your email for your new password. We strongly encourage you to change it!")
      false
    .fail (result,status) ->
      false
  $("#login_button").click ->
    noSubmit()
    resetFormSubmit()
  $("#login").submit ->
    noSubmit()
    resetFormSubmit()


$ ->
  if not window.passwords.submitSelector?
    selector = "#createUser_submit"
  else
    selector = window.passwords.submitSelector
  if $("#password.create").exists()
    loadJS(window.totpParams.relative+"js/zxcvbn/zxcvbn.js")
    $("#password.create")
    .keyup ->
      checkPasswordLive()
    .change ->
      checkPasswordLive()
    $("#password2")
    .change ->
      checkMatchPassword()
    .keyup ->
      checkMatchPassword()
    $("input").blur ->
      checkPasswordLive()
  $("#totp_submit").submit ->
    doTOTPSubmit()
  $("#verify_totp_button").click ->
    doTOTPSubmit()
  $("#totp_start").submit ->
    makeTOTP()
  $("#add_totp_button").click ->
    makeTOTP()
  $("#totp_remove").submit ->
    doTOTPRemove()
  $("#remove_totp_button").click ->
    doTOTPRemove()
  $("#alternate_verification_prompt").click ->
    giveAltVerificationOptions()
    return false
  $("#verify_phone").submit ->
    verifyPhone()
  $("#verify_phone_button").click ->
    verifyPhone();
  $("#verify_later").click ->
    window.location.href = window.totpParams.home
  $("#totp_help").click ->
    showInstructions()
  $("#showAdvancedOptions").click ->
    domain = $(this).attr('data-domain')
    has2fa = if $(this).attr("data-user-tfa") is 'true' then true else false
    showAdvancedOptions(domain,has2fa)
  try
    if $.url().param("showhelp")? then showInstructions()
  catch e
    delay 300, ->
      if $.url().param("showhelp")? then showInstructions()
  $("#next.continue").click ->
    window.location.href = window.totpParams.home
  # Load stylesheets
  $("<link/>",{
    rel:"stylesheet"
    type:"text/css"
    media:"screen"
    href:window.totpParams.combinedStylesheetPath
    }).appendTo("head")
