<?php
/*
 * This is designed to be included in a page, and doesn't have the page framework on its own.
 */

$debug=false;
$use_javascript_cookies=false;

// Global cookie vars
/*
 * Baseurl is overwritten if specified in config
 */
$baseurl = 'http';
if ($_SERVER["HTTPS"] == "on") {$baseurl .= "s";}
$baseurl .= "://www.";
$baseurl.=$_SERVER['HTTP_HOST'];

require_once(dirname(__FILE__).'/CONFIG.php');

$base=array_slice(explode(".",$baseurl),-2);
$domain=$base[0];
$shorturl=implode(".",$base);

if(!is_numeric($minimum_password_length)) $minimum_password_length=8;
if(!is_numeric($password_threshold_length)) $password_threshold_length=20;

/*
 * Cookie names for tracking
 */

$cookieuser=$domain."_user";
$cookieperson=$domain."_name";
$cookieauth=$domain."_auth";
$cookiekey=$domain."_secret";
$cookiepic=$domain."_pic";
$cookielink=$domain."_link";


/*
 * Required inclusions
 */

require_once(dirname(__FILE__).'/handlers/login_functions.php');
require_once(dirname(__FILE__).'/handlers/functions.inc');
require_once(dirname(__FILE__).'/handlers/db_hook.inc');
require_once(dirname(__FILE__).'/handlers/xml.php');


$xml=new Xml;
$user=new UserFunctions;

#$debug = true;

if($debug==true)
  {
    if($r===true) echo "<p>(Database OK)</p>";
    else echo "<p>(Database Error - ' $r ')</p>";
    echo "<p>Visiting $baseurl on '$shorturl' with a human domain '$domain'</p>";
    echo displayDebug($_REQUEST);
    echo "<p>".displayDebug(sanitize('tigerhawk_vok-goes.special@gmail.com'))."</p>";
    $xkcd_check="Robert'); DROP TABLE Students;--"; // https://xkcd.com/327/
    echo "<p>".displayDebug(sanitize($xkcd_check))."</p>"; // This should have escaped code
    echo "<p>User Validation:</p>";
    echo displayDebug($user->validateUser($_COOKIE[$cookielink],null,null,true));
  }

try
{
  $logged_in=$user->validateUser($_COOKIE[$cookielink]);
  # This should only show when there isn't two factor enabled ...
  $twofactor = $user->has2FA() ? "Remove two-factor authentication":"Add two-factor authentication";
}
catch (Exception $e)
  {
    # There have been no cookies set.
    $logged_in = false;
    $twofactor = "Please log in.";
  }

if($logged_in)
  {
    $full_name=$xml->getTagContents($_COOKIE[$cookieperson],"<name>");
    $first_name=$xml->getTagContents($_COOKIE[$cookieperson],"<fname>");
    $display_name=$xml->getTagContents($_COOKIE[$cookieperson],"<dname>");
    if(empty($first_name)) $first_name = $_COOKIE[$cookieperson];
  }
else
  {
    if($captive_login) header("Refresh: 0; url=$baseurl");
  }



$settings_blob = "<section id='account_settings'><h2>Settings</h2><p><a href='?2fa=t'>".$twofactor."</a></p></section>";


$login_output="<div id='login_block'>";
$alt_forms="<div id='alt_logins'>
<!-- OpenID, Google, Twitter, Facebook -->
</div>";
$login_preamble = "
	    <h2>User Login</h2>";
if($_REQUEST['m']=='login_error') $login_preamble.="<h3 class='error'>There was a problem setting your login credentials. Please try again.</h3>";
$loginform = "
	    <form id='login' method='post' action='?q=submitlogin'>
            <fieldset>
              <legend>Login</legend>
	      <label for='username'>
		Email:
	      </label>
	      <input type='email' name='username' id='username' placeholder='user@domain.com' autofocus='autofocus' required='required'/>
	      <br/>
	      <label for='password'>
		Password:
	      </label>
	      <input type='password' name='password' id='password' placeholder='Password' required='required'/>
</fieldset>";
$loginform_close="	      <br/>
	      <input type='submit' value='Login' id='login_button'/>
	    </form>$alt_forms<br/><p id='form_create_new_account'><small>Don't have an account yet? <a href='?q=create'>Create one</a>!</small></p>";
$big_login=$login_preabmle.$loginform.$loginform_close;
$small_login=$loginform.$loginform_close;
if($_REQUEST['q']=='submitlogin')
  {
    if(!empty($_POST['username']) && !empty($_POST['password']))
      {
        $totp = empty($_POST["totp"]) ? false:$_POST["totp"];
        $res = $user->lookupUser($_POST['username'], $_POST['password'],true,$totp);
        if($res[0] === false && $res["totp"] === true)
          {
            # User has two factor authentication. Prompt!
            $totpclass = $res["error"]===false ? "good":"error";
            $is_encrypted = empty($res["encrypted_hash"]) || empty($res["encrypted_secret"]);
            $hash =  $is_encrypted ? $_COOKIE[$cookieauth]:$res["encrypted_hash"];
            $secret =  $is_encrypted ? $_COOKIE[$cookiekey]:$res["encrypted_secret"];
            $totp_buffer = "<section id='totp_prompt'>
  <p class='$totp_class' id='totp_message'>".$res["human_error"]."</p>
  <form id='totp_submit' onsubmit='event.preventDefault();'>
    <fieldset>
      <legend>Two-Factor Authentication</legend>
      <input type='number' id='totp_code' name='totp_code' placeholder='Code' size='6' maxlength='6'/>
      <input type='hidden' id='username' name='username' value='".$_POST['username']."'/>
      <input type='hidden' id='password' name='password' value='".$res["encrypted_password"]."'/>
      <input type='hidden' id='secret' name='secret' value='".$secret."'/>
      <input type='hidden' id='hash' name='hash' value='".$hash."'/>
      <input type='hidden' id='remote' name='remote' value='".$_SERVER['REMOTE_ADDR']."'/>
      <input type='hidden' id='encrypted' name='encrypted' value='".$user->strbool($is_encrypted)."'/>
      <button id='verify_totp_button' class='totpbutton'>Verify</button>
    </fieldset>
    <p><small><a href='#'  id='alternate_verification_prompt'>I can't use my app</a></small></p>
  </form>
</section>";
            $login_output .= $totp_buffer;
          }
        else if($res[0] !==false)
          {
            // Successful login
            $userdata=$res[1];
            $id=$userdata['id'];
            $name_block = $userdata['name'];
            # Be sure we get the name from the actual userdata
            $full_name=$xml->getTagContents($name_block,"<name>");
            $first_name=$xml->getTagContents($name_block,"<fname>");
            $display_name=$xml->getTagContents($name_block,"<dname>");
            # Account for possible differnt modes of saving
            if(empty($first_name)) $first_name = $name_block;
            $login_output.="<h3 id='welcome_back'>Welcome back, ".$first_name."</h3>"; //Welcome message

            $cookie_result=$user->createCookieTokens($userdata);
            if($debug)
              {
                echo "<p>Cookie Result:</p>";
                echo displayDebug($cookie_result);
                echo "<p>Entering cookie handling post call ...</p>";
              }
            if(!$cookie_result['status'])
              {
                echo "<div class='error'>".$cookie_result['error']."</div>";
                if($debug) echo "<p>Got a cookie error, see above cookie result</p>";
              }
            else
              {
                // Need access -- name (id), email. Give server access?
                $login_output.="<p>Logging in from another device or browser will end your session here. You will be redirected in 3 seconds...</p>";
                $logged_in=true;
                $durl=$_SERVER['PHP_SELF'];
                if(isset($_COOKIE[$cookieuser]) || $logged_in===true)
                  {
                    $cookiedebug.=" cookie-enter";
                    // Cookies are set
                    $result=lookupItem($_COOKIE[$cookieuser],'username',null,null,false);
                    if($result!==false)
                      {
                        // good user
                        // Check auth
                        $cookiedebug.='good-user check-auth '.print_r($_COOKIE[$cookieuser],true);
                        $userdata=mysqli_fetch_assoc($result);
                        $pw_characters=json_decode($userdata['password'],true);

                        // pieces:
                        $salt=$cookie_result['source']['salt'];
                        $otsalt=$cookie_result['source']['server_salt'];
                        $cookie_secret=$cookie_result['source']['secret']; // won't grab new data until refresh, use passed

                        $value_create=array($cookie_secret,$salt,$otsalt,$_SERVER['REMOTE_ADDR'],$site_security_token);
                        $value=sha1(implode('',$value_create));
                        if($value==$cookie_result['raw_auth'])
                          {
                            // Good cookie
                            $cookiedebug.=' good-auth';
                            $logged_in=true;
                            $user=$_COOKIE[$cookieuser];
                            if($use_javascript_cookies) $deferredJS.="\n".$cookie_result['js'];
                          }
                        else
                          {
                            // bad cookie
                            $cookiedebug.="\n bad-auth ".print_r($cookie_result,true)." for $cookieuser. \nExpecting: $value from ".print_r($value_create,true)."\n Given:\n ".$cookie_result['raw_auth']." from ".print_r($cookie_result['source'],true)." \nRaw cookie:\n".print_r($_COOKIE,true);
                            if(!$debug)
                              {
                                $cookiedebug.="\n\nWiping ...";
                                setcookie($cookieuser,false,time()-3600*24*365);
                                setcookie($cookieperson,false,time()-3600*24*365);
                                setcookie($cookieauth,false,time()-3600*24*365);
                                setcookie($cookiekey,false,time()-3600*24*365);
                                setcookie($cookiepic,false,time()-3600*24*365);
                                $durl.="?m=login_error";
                              }
                            else $cookiedebug.="\nWould wipe here";
                          }
                      }
                    else
                      {
                        // bad user
                        $cookiedebug.=' bad-user';
                        if(!$debug)
                          {
                            $cookiedebug.="\n\nWiping ...";
                            setcookie($cookieuser,false,time()-3600*24*365);
                            setcookie($cookieperson,false,time()-3600*24*365);
                            setcookie($cookieauth,false,time()-3600*24*365);
                            setcookie($cookiekey,false,time()-3600*24*365);
                            setcookie($cookiepic,false,time()-3600*24*365);
                            $durl.="?m=login_error";
                          }
                        else $cookiedebug.="\nWould wipe here";
                      }
                  }
                else
                  {
                    $logged_in=false;
                    $cookiedebug.='cookies not set for '.$domain;
                  }
                if($debug)
                  {
                    echo "<pre>CookieDebug:\n";
                    echo $cookiedebug;
                    echo "\nCookie Result:\n</pre>";
                    echo displayDebug($cookie_result);
                    echo "<p>Cookie Supervar</p>";
                    echo displayDebug($_COOKIE);
                    echo "<p>Would refresh to:".$durl."</p>";

                  }
                else header("Refresh: 3; url=".$durl);
              }
            ob_end_flush(); // Flush the buffer, start displaying
          }
        else
          {
            ob_end_flush();
            $login_output.=$login_preamble;
            $login_output.="<div class='error'><p>Sorry! <br/>" . $res['message'] . "</p><aside class='ssmall'>Did you mean to <a href='?q=create'>create a new account instead?</a></aside></div>";
            $failcount=intval($_POST['failcount'])+1;
            $loginform_whole = $loginform."
              <input type='hidden' name='failcount' id='failcount' value='$fail'/>".$loginform_close;


            if($failcount<10) $login_output.=$loginform_whole;
            else
              {
                $result=lookupItem($_POST['username'],'username',null,null,false,true);
                if($result!==false)
                  {
                    $userdata=mysqli_fetch_assoc($result);
                    $id=$userdata['id'];
                  }
                $query="UPDATE `$default_user_table` SET dtime=".$user->microtime_float()." WHERE id=$id";
                $query2="UPDATE `$default_user_table` SET disabled=true WHERE id=$id";
                $l=openDB();
                $result1=mysqli_query($l,$query);
                if(!$result1) echo "<p class='error'>".mysqli_error($l)."</p>";
                else
                  {
                    $result2=execAndCloseDB($l,$query2);
                    if(!$result2) echo "<p class='error'>".mysqli_error($l)."</p>";
                    else
                      {
                        $login_output.="<p>Sorry, you've had ten failed login attempts. Your account has been disabled for 1 hour.</p>";
                      }
                  }

              }
          }
      }
    else
      {
        $login_output.="<h1>Whoops! You forgot something.</h1><h2>Please try again.</h2>";
        $login_output.=$loginform.$loginform_close;
      }
  }
else if($_REQUEST['q']=='create')
  {
    // Create a new user
    // display login form
    // include a captcha and honeypot
    require_once(dirname(__FILE__).'/handlers/recaptchalib.php');
    if(!empty($recaptcha_public_key) && !empty($recaptcha_private_key))
      {

        $recaptcha=recaptcha_get_html($recaptcha_public_key);
        $prefill_email = $_POST['username'];
        $prefill_display = $_POST['dname'];
        $prefill_lname = $_POST['lname'];
        $prefill_fname = $_POST['fname'];
        $createform = "<style type='text/css'>.hide { display:none !important; }</style>
	    <form id='login' method='post' action='?q=create&amp;s=next'>
              <div class='left'>
	      <label for='username'>
		Email:
	      </label>
	      <input type='email' name='username' id='username' value='$prefill_email' autofocus='autofocus' placeholder='user@domain.com' required='required'/>
	      <br/>
	      <label for='password'>
		Password:
	      </label>
	      <input type='password' name='password' id='password' placeholder='Password' required='required'/>
	      <br/>
	      <label for='password2'>
		Confirm Password:
	      </label>
	      <input type='password' name='password2' id='password2' placeholder='Confirm password' required='required'/>
	      <br/>
              <label for='fname'>
                First Name:
              </label>
	      <input type='text' name='fname' id='fname' value='$prefill_fname' placeholder='Leslie' required='required'/>
	      <br/>
              <label for='lname'>
                Last Name:
              </label>
	      <input type='text' name='lname' id='lname' value='$prefill_lname' placeholder='Smith' required='required'/>
	      <br/>
              <label for='dname'>
                Display Name:
              </label>
	      <input type='text' name='dname' id='dname' placeholder='ThatUserY2K' required='required'/>
	      <br/>
              <label for='honey' class='hide' >
                Do not fill this field
              </label>
	      <input type='text' name='honey' id='honey' class='hide'/>
              $recaptcha
              </div>
              <div class='right' style='width:25%'>
              <p><small>We require a password of at least $minimum_password_length characters with at least one upper case letter, at least one lower case letter, and at least one digit or special character. You can also use <a href='http://imgs.xkcd.com/comics/password_strength.png'>any long password</a> of at least $password_threshold_length characters, with no security requirements.</small></p>
              </div>
              <br class='clear'/>
	      <input type='submit' value='Create' id='createUser_submit' disabled='disabled'/>
	    </form><br class='clear'/>";
        $secnotice="<p><small>Remember your security best practices! Do not use the same password you use for other sites. While your information is <a href='http://en.wikipedia.org/wiki/Cryptographic_hash_function' $newwindow>hashed</a> with a multiple-round hash function, <a href='http://arstechnica.com/security/2013/05/how-crackers-make-minced-meat-out-of-your-passwords/' $newwindow>passwords are easy to crack!</a></small></p>";
        $createform.=$secnotice; # Password security notice
        if($_SERVER["HTTPS"] != "on")
          {
            $createform.="<div class='error danger'><p>Warning: This form is insecure</p></div>";
          }

        if($_REQUEST['s']=='next')
          {
            $email_preg="/[a-z0-9!#$%&'*+=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[a-z]{2}|com|org|net|edu|gov|mil|biz|info|mobi|name|aero|asia|jobs|museum)\b/";
            if(!empty($_POST['honey']))
              {
                $login_ouptut.="<p class='error'>Whoops! You tripped one of our bot tests. If you are not a bot, please go back and try again. Read your fields carefully!</p>";
                $_POST['email']='bob';
              }
            $resp = recaptcha_check_answer ($recaptcha_private_key,
            $_SERVER["REMOTE_ADDR"],
            $_POST["recaptcha_challenge_field"],
            $_POST["recaptcha_response_field"]);

            if (!$resp->is_valid && !$debug)
              {
                // What happens when the CAPTCHA was entered incorrectly
                $login_output.=("The reCAPTCHA wasn't entered correctly. Go back and try it again." .
                "(reCAPTCHA said: " . $resp->error . ")");
              }
            else
              {
                // Successful verification
                if(preg_match($email_preg,$_POST['username']))
                  {
                    if($_POST['password']==$_POST['password2'])
                      {
                        if(preg_match('/(?=^.{'.$minimum_password_length.',}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/',$_POST['password']) || strlen($_POST['password'])>=$password_threshold_length) // validate email, use in validation to notify user.
                          {
                            $res=$user->createUser($_POST['username'],$_POST['password'],array($_POST['fname'],$_POST['lname']),$_POST['dname']);
                            if($res[0])
                              {
                                $login_output.="<h3>".$res[1]."</h3>"; //jumpto1
                                // email user
                                $to=$_POST['username'];
                                $headers  = 'MIME-Version: 1.0' . "\r\n";
                                $headers .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";
                                $headers .= "From: Account Registration <blackhole@".$shorturl.">";
                                $subject='New Account Creation';
                                $body = "<p>Congratulations! Your new account has been created. Your username is this email address ($to). We do not keep a record of your password we can access, so please be sure to remember it!</p><p>If you do forget your password, you can <a href='mailto:".$service_email."?subject=Reset%20Password'>email support</a> to reset your password for you with a picture of government ID with your registered name and zip code. All secure data will be lost in the reset.</p>";
                                if(mail($to,$subject,$body,$headers)) $login_output.="<p>A confirmation email has been sent to your inbox at $to .</p>";
                                else
                                  {
                                    // no email
                                  }
                                /***
                                 * Post login behavior ...
                                 ***/
                                $deferredJS.=$res['js'];
                                // ... redirect to home
                                $deferredJS.="\nwindow.location=\"$baseurl\"";
                                header("Refresh: 3; url=".$baseurl);

                              }
                            else
                              {
                                if($debug) $login_output.=displayDebug($res);
                                $login_output.="<p class='error'>".$res[1]."</p><p>Use your browser's back button to try again.</p>";
                              }
                            ob_end_flush();
                          }
                        else
                          {
                            $login_output.="<p class='error'>Your password was not long enough ($minimum_password_length characters) or did not match minimum complexity levels (one upper case letter, one lower case letter, one digit or special character). You can also use <a href='http://imgs.xkcd.com/comics/password_strength.png' id='any_long_pass'>any long password</a> of at least $password_threshold_length characters. Please go back and try again.</p>";
                          }
                      }
                    else $login_output.="<p class='error'>Your passwords did not match. Please go back and try again.</p>";
                  }
                else $login_output.="<p class='error'>Error: Your email address was invalid. Please enter a valid email.</p>";
              }
          }
        else $login_output.=$createform;
      }
    else $login_output.="<p class='error'>This site's ReCAPTCHA library hasn't been set up. Please contact the site administrator.</p>";
  }
else if($_REQUEST['q']=='logout')
  {
    setcookie($cookieuser,false,time()-3600*24*365);
    setcookie($cookieperson,false,time()-3600*24*365);
    setcookie($cookieauth,false,time()-3600*24*365);
    setcookie($cookiekey,false,time()-3600*24*365);
    setcookie($cookiepic,false,time()-3600*24*365);
    header("Refresh: 0; url=".$_SERVER['PHP_SELF']);
    // do JS cookie wipe too
    $deferredJS.="\n$.removeCookie('$cookieuser');";
    $deferredJS.="\n$.removeCookie('$cookieperson');";
    $deferredJS.="\n$.removeCookie('$cookieauth');";
    $deferredJS.="\n$.removeCookie('$cookiekey');";
    $deferredJS.="\n$.removeCookie('$cookiepic');";
    ob_end_flush();
    $login_output.=$loginform.$loginform_close;
  }
else if(isset($_REQUEST['confirm']))
  {
    // toggle user flag
    $id=$_REQUEST['lookup'];
    $result=lookupItem($id,'id',null,null,false);
    if($result!==false)
      {
        $userdata=mysqli_fetch_assoc($result);
        //  $fields=array('username','pass','creation','salt','name','flag');
        $user=$userdata['username'];
        $ne=$userdata['name'];
        $salt=$userdata['salt'];
        $creation=$userdata['creation'];
        $hash=sha1($user.$ne.$salt);
        if($_REQUEST['token']==$creation && $_REQUEST['confirm']==$hash)
          {
            if($userdata['flag'])
              {
                $flag=0;
                $status='deactivated';
              }
            else
              {
                $flag=1;
                $status='activated';

              }
            $query="UPDATE `$default_user_table` SET flag=$flag WHERE id=$id";
            $l=openDB();
            $result=execAndCloseDB($l,$query);
            if(!$result) $login_output.="<p class='error'>" . mysqli_error($l) . "</p>";
            else
              {
                $login_output.="<p>Success! User $status</p>";
                $email=sanitize($_REQUEST['email']);
                $subject='$title account activated';
                $body="<p>This is a notice from $title to let you know your account has been $status.";
                if($status=='activated') $body.=" You may now <a href='".$baseurl."/'>log in here</a></p><p>Thanks!</p>";
                $headers  = 'MIME-Version: 1.0' . "\r\n";
                $headers .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";
                $headers .= "From: $title <blackhole@".substr($baseurl,strpos($baseurl,'.')).">";
                if(mail($email,$subject,$body,$headers)) echo "<p>Additionally, an email was sent to '$email' notifying them of their activation.</p>";
                else $login_output.="<p class='error'>Notice: email notification of activation failed. Please manually notify $email about their activation.</p>";
              }
          }
        else $login_output.="<p class='error'>Invalid user confirmation code.</p>";
      }
    else $login_output.="<p class='error'>Invalid user ID</p>";
  }
else if(isset($_REQUEST['2fa']))
  {
    if($logged_in && !$user->has2FA())
      {
        # Give user 2FA
        $totp_add_form = "<section id='totp_add'>
  <p id='totp_message'>Two factor authentication is very secure, but when you enable it, you'll be unable to log in without your mobile device.</p>
  <form id='totp_start'>
    <fieldset>
      <legend>Login to continue</legend>
      <input type='email' value='".$user->username."' readonly='readonly' id='username' name='username'/><br/>
      <input type='password' id='password' name='password'/><br/>
      <input type='hidden' id='secret' name='secret' value='".$_COOKIE[$cookiekey]."'/>
      <input type='hidden' id='hash' name='hash' value='".$_COOKIE[$cookieauth]."'/>
      <button id='add_totp_button' class='totpbutton'>Add Two-Factor Authentication</button>
    </fieldset>
  </form>
</section>";
        $login_output .= $totp_add_form;
      }
    else if ($logged_in && $user->has2FA())
      {
        # Remove 2FA from the user
        $totp_remove_form = "<section id='totp_remove'>
  <p class='error'>Are you sure you want to disable two-factor authentication?</p>
  <form id='totp_remove' onsubmit='event.preventDefault();'>
    <fieldset>
      <legend>Remove Two-Factor Authentication</legend>
      <input type='email' value='".$username."' readonly='readonly' id='username' name='username'/><br/>
      <input type='password' id='password' name='password'/><br/>
      <input type='number' id='code' name='code' placeholder='Authenticator Code or Backup Code' size='32' maxlength='32'/>
      <button id='remove_totp_button' class='totpbutton'>Remove Two-Factor Authentication</button>
    </fieldset>
  </form>
</section>";
        $login_output .= $totp_remove_form;
      }
    else if (!$logged_in)
      {
        $login_output .= "<p class='error'>You have to be logged in to set up two factor authentication.<br/><a href='?q=login'>Click here to log in</a></p>";
      }
    else
      {
        # Should never trigger
        throw(new Exception("Unexpected condition setting up two-factor authentication"));
      }
  }
else
  {
    if(!$logged_in) $login_output.=$login_preamble . $loginform.$loginform_close;
    else $login_output.="<p id='signin_greeting'>Welcome back, $first_name</p><br/><p id='logout_para'><aside class='ssmall'><a href='?q=logout'>(Logout)</a></aside></p>".$settings_blob;
  }
$login_output.="</div>";
ob_end_flush();
echo "<script type='text/javascript'>
        if(typeof passwords != 'object') passwords = new Object();
        passwords.overrideLength=$password_threshold_length;
        passwords.minLen=$minimum_password_length;
function loadScript(url, callback) {
    // Adding the script tag to the head as suggested before
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;

    // Then bind the event to the callback function.
    // There are several events for cross browser compatibility.
    script.onreadystatechange = callback;
    script.onload = callback;

    // Fire the loading
    head.appendChild(script);
}

var lateJS= function() {
    try {
        console.log('Loading late libraries');
        $.getScript('js/zxcvbn/zxcvbn.js');
        $.getScript('js/base64.min.js');
        $.getScript('js/jquery.cookie.min.js');
        $.getScript('js/purl.min.js');
        $.getScript('js/c.min.js');
        $(document).ready(function(){
            $deferredJS
        });
    }
    catch (e) {
        // failed to load anyway
        console.log('Failed to load jQuery');
        // Draw an error
    }
}

window.onload = function() {
    if (!window.jQuery) {
        loadScript('//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js',lateJS);
    }
    else lateJS;
}
</script>";
?>
