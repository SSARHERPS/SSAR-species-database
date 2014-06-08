# Login functions

if typeof passwords isnt 'object' then passwords = new Object()
passwords.goodbg = "#cae682"
passwords.badbg = "#e5786d"
# Password lengths can be overriden in CONFIG.php,
# which then defines the values for these before the script loads.
passwords.minLength ?= 8
passwords.overrideLength ?= 21

if typeof totpParams isnt 'object' then totpParams = new Object()
totpParams.mainStylesheetPath = "css/otp_styles.css"
totpParams.popStylesheetPath = "css/otp_panels.css"
totpParams.popClass = "pop-panel"
# The value $redirect_url in CONFIG.php overrides this value
if not totpParams.home?
  url = $.url()
  totpParams.home =  url.attr('protocol') + '://' + url.attr('host') + '/'

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
  if not isNull($("#password2").val())
    checkMatchPassword()
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

doTOTPSubmit = (home = totpParams.home) ->
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
  urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + url.attr('directory') + "/../" + ajaxLanding
  args = "action=verifytotp&code=#{code}&user=#{user}&password=#{pass}&remote=#{ip}"
  totp = $.post(urlString ,args,'json')
  console.log("Checking",urlString + "?" + args)
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
            console.log(result["cookies"])
            delay 500, ->
              window.location.href = home
      catch e
        console.error("Unexpected error while validating",e.message);
    else
      $("#totp_message").text(result.human_error)
      $("#totp_code").val("") # Clear it
      $("#totp_code").focus()
      stopLoadError()
      console.error("Invalid code error",result.error,result);
  totp.fail (result,status) ->
    # Be smart about the failure
    $("#totp_message").text("Failed to contact server. Please try again.")
    console.error("AJAX failure",urlString  + "?" + args,result,status)
    stopLoadError()

doTOTPRemove = ->
  # Remove 2FA
  noSubmit()

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
  urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + url.attr('directory') + "/../" + ajaxLanding
  args = "action=maketotp&password=#{password}&user=#{user}"
  totp = $.post(urlString,args,'json')
  totp.done (result) ->
    # Yay! Replace the form ....
    if result.status is true
      svg = result.svg
      raw = result.raw
      # Name these in variables to avoid user conflicts
      show_secret_id = "show_secret"
      show_alt = "showAltBarcode"
      barcodeDiv = "secretBarcode"
      html = "<form id='totp_verify'>
  <p>To continue, scan this barcode with your smartphone application.</p>
  <p style='font-weight:bold'>If you're unable to do so, <a href='#' id='#{show_secret_id}'>click here to manually input your key.</a></p>
  <div id='#{barcodeDiv}'>
    #{result.svg}
    <p>Don't see the barcode? <a href='#' id='#{show_alt}'>Click here</a></p>
  </div>
  <p>Once you've done so, enter your code below to verify your setup.</p>
  <fieldset>
    <legend>Confirmation</legend>
    <input type='number' size='6' maxlength='6' id='code' name='code' placeholder='Code'/>
    <input type='hidden' id='username' name='username' value='#{user}'/>
    <button id='verify_totp_button' class='totpbutton'>Verify</button>
  </fieldset>
</form>"
      $("#totp_add").html(html)
      $("##{show_secret_id}").click ->
        popupSecret(result.human_secret)
      $("##{show_alt}").click ->
        altImg = "<img src='#{result.raw}' alt='TOTP barcode'/>"
        $("#{barcode_div}").html(altImg)
      $("#verify_totp_button").click ->
        noSubmit()
        saveTOTP(key,hash)
      $("#totp_verify").submit ->
        noSubmit()
        saveTOTP(key,hash)
      stopLoad()
    else
      console.error("Couldn't generate TOTP code",urlString  + "?" + args)
      $("#totp_message").text("There was an error generating your code. Please try again.")
      stopLoadError()
  totp.fail (result,status) ->
    $("#totp_message").text("Failed to contact server. Please try again.")
    console.error("AJAX failure",urlString  + "?" + args,result,status)
    stopLoadError()
  return false

saveTOTP = (key,hash) ->
  noSubmit()
  code = $("#code").val()
  user = $("#username").val()
  url = $.url()
  ajaxLanding = "async_login_handler.php"
  urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + url.attr('directory') + "/../" + ajaxLanding
  args = "action=savetotp&secret=#{key}&user=#{user}&hash=#{hash}&code=#{code}"
  console.log("Checking",urlString  + "?" + args)
  totp = $.post(urlString ,args,'json')
  totp.done (result) ->
    # We're done!
    if result.status is true
      html = "<h1>Done!</h1><h2>Write down and save this backup code. Without it, you cannot disable two-factor authentication if you lose your device.</h2><pre>#{result.backup}</pre>"
      $("#totp_add").html(html)
      console.log("Success!")
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
    href:totpParams.popStylesheetPath
    }).appendTo("head")
  html="<div id='secret_id_panel' class='#{totpParams.popClass}'><p class='close-popup'>X</p><h2>#{secret}</h2></div>"
  $("#totp_add").after(html)
  $(".close-popup").click ->
    $("#secret_id_panel").remove()

giveAltVerificationOptions = ->
  # Put up an overlay, and ask if the user wants to remove 2FA or get a text
  url = $.url()
  ajaxLanding = "async_login_handler.php"
  urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + url.attr('directory') + "/../" + ajaxLanding
  user = $("#username").val()
  args = "action=cansms&user=#{user}"
  remove_id = "remove_totp_link"
  sms_id = "send_totp_sms"
  pane_id = "alt_auth_pane"
  pane_messages = "alt_auth_messages"
  messages = new Object()
  messages.remove = "<a href='#' id='#{remove_id}'>Remove two-factor authentication</a>"
  # First see if the user can SMS at all before populating the message options
  sms = $.get(urlString,args,'json')
  sms.done (result) ->
    if result[0] is true
      messages.sms = "<a href='#' id='#{sms_id}'>Send SMS</a>"
  sms.fail (result,status) ->
    # Just don't populate the thing
    console.error("Could not check SMS-ability",result,status)
  pop_content = ""
  $.each messages,(k,v) ->
    pop_content += v
  html = "<div id='#{pane_id}'><p>#{pop_content}</p><p id='#{pane_messages}'></p></div>"
  # Attach it to DOM
  # Attach event handlers
  $("##{remove_id}").click ->
    # Take them to the page where they can remove the TOTP
    totpParams.home ?=  url.attr('protocol') + '://' + url.attr('host') + '/login.php'
    window.location.href = totpParams.home + "?2fa=t"
  $("##{sms_id}").click ->
    # Attempt to send the TOTP
    args = "action=sendtotptext&user=#{user}"
    sms_totp = $.get(urlString,args,'json')
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

verifyPhone = ->
  noSubmit()
  # Verify phone auth status
  # If not true, get the server to SMS a secret code
  # Create verification field
  # Validate field against server and update status

noSubmit = ->
  event.preventDefault()
  event.returnValue = false

$ ->
  $("#password")
  .keyup ->
    checkPasswordLive()
  .change ->
    checkPasswordLive()
  $("#password2")
  .change ->
    checkMatchPassword()
  .keyup ->
    checkMatchPassword()
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
    giveAltVerificationOptions();
  $("#verify_phone").click ->
    verifyPhone()
  $("#verify_phone_button").click ->
    verifyPhone();
  $("#verify_later").click ->
    window.location.href = totpParams.home
  $("<link/>",{
    rel:"stylesheet"
    type:"text/css"
    media:"screen"
    href:totpParams.mainStylesheetPath
    }).appendTo("head")  
