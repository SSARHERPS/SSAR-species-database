# Login functions

if typeof window.passwords isnt 'object' then window.passwords = new Object()
window.passwords.goodbg = "#cae682"
window.passwords.badbg = "#e5786d"
# Password lengths can be overriden in CONFIG.php,
# which then defines the values for these before the script loads.
window.passwords.minLength ?= 8
window.passwords.overrideLength ?= 21

if typeof window.totpParams isnt 'object' then window.totpParams = new Object()
window.totpParams.mainStylesheetPath = "css/otp_styles.css"
window.totpParams.popStylesheetPath = "css/otp_panels.css"
window.totpParams.popClass = "pop-panel"
# The value $redirect_url in CONFIG.php overrides this value
if not window.totpParams.home?
  url = $.url()
  window.totpParams.home =  url.attr('protocol') + '://' + url.attr('host') + '/'

checkPasswordLive = ->
  pass = $("#password").val()
  # The 8 should be passwords.minLength
  if pass.length >window.passwords.overrideLength or pass.match(/^(?:(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$)$/)
    $("#password").css("background",window.passwords.goodbg)
    window.passwords.basepwgood = true
  else
    $("#password").css("background",window.passwords.badbg)
    window.passwords.basepwgood = false
  evalRequirements()
  if not isNull($("#password2").val())
    checkMatchPassword()
    toggleNewUserSubmit()
  return false

checkMatchPassword = ->
  if $("#password").val() is $("#password2").val()
    $('#password2').css('background', window.passwords.goodbg)
    window.passwords.passmatch = true
  else
    $('#password2').css('background', window.passwords.badbg)
    window.passwords.passmatch = false
  toggleNewUserSubmit()
  return false

toggleNewUserSubmit = ->
  try
    dbool = not(window.passwords.passmatch && window.passwords.basepwgood)
    $("#createUser_submit").attr("disabled",dbool)
  catch e
    window.passwords.passmatch = false
    window.passwords.basepwgood = false

evalRequirements = ->
  unless $("#strength-meter").exists()
    html = "<div id='strength-meter'><div id='strength-requirements'><div id='strength-alpha'><p class='label'>a</p><div class='strength-eval'></div></div><div id='strength-alphacap'><p class='label'>A</p><div class='strength-eval'></div></div><div id='strength-numspecial'><p class='label'>1/!</p><div class='strength-eval'></div></div></div><div id='strength-bar'><label for='password-strength'>Strength: </label><progress id='password-strength' max='5'></progress></div></div>"
    $("#login .right").prepend(html)
  pass = $("#password").val()
  pstrength = zxcvbn(pass)
  $(".strength-eval").css("background",window.passwords.badbg)
  if pass.length > 20 then $(".strength-eval").css("background",window.passwords.goodbg)
  else
    if pass.match(/^(?:((?=.*\d)|(?=.*\W+)).*$)$/) then $("#strength-numspecial .strength-eval").css("background",window.passwords.goodbg)
    if pass.match(/^(?=.*[a-z]).*$/) then $("#strength-alpha .strength-eval").css("background",window.passwords.goodbg)
    if pass.match(/^(?=.*[A-Z]).*$/) then $("#strength-alphacap .strength-eval").css("background",window.passwords.goodbg)
  $("#password-strength").attr("value",pstrength.score+1);

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
  urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + url.attr('directory') + "/../" + ajaxLanding
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
      # Take them to the page where they can remove the TOTP
      window.totpParams.home ?=  url.attr('protocol') + '://' + url.attr('host') + '/login.php'
      window.location.href = window.totpParams.home + "?2fa=t"

verifyPhone = ->
  noSubmit()
  # Verify phone auth status
  url = $.url()
  ajaxLanding = "async_login_handler.php"
  urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + url.attr('directory') + "/../" + ajaxLanding
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
        message = "<p>You've already verified your phone number, thanks!</p>"
        setClass = "good"
      else
        message = result.human_error
        setClass = "error"
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
  $.get path
  .done (html) ->
    $("article").after(html)
    $("article").addClass("blur")
    # Fill the images
    url = $.url()
    urlString = url.attr('protocol') + '://' + url.attr('host') + '/' + url.attr('directory') + "/../"
    assetPath = "#{urlString}assets/"
    $(".android").html("<img src='#{assetPath}playstore.png' alt='Google Play Store'/>")
    $(".ios").html("<img src='#{assetPath}appstore.png' alt='iOS App Store'/>")
    $(".wp8").html("<img src='#{assetPath}wpstore.png' alt='Windows Phone Store'/>")
    $(".app_link_container a").addClass("newwindow")
    mapNewWindows()
    $(".close-popup").click ->
      $("article").removeClass("blur")
      $("#cover_wrapper").remove()
  .fail (result,status) ->
    console.error("Failed to load instructions @ #{path}",result,status)

noSubmit = ->
  event.preventDefault()
  event.returnValue = false

$ ->
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
  $("#verify_phone").submit ->
    verifyPhone()
  $("#verify_phone_button").click ->
    verifyPhone();
  $("#verify_later").click ->
    window.location.href = window.totpParams.home
  $("#totp_help").click ->
    showInstructions()
  $("<link/>",{
    rel:"stylesheet"
    type:"text/css"
    media:"screen"
    href:window.totpParams.mainStylesheetPath
    }).appendTo("head")
