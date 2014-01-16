<?php
/*
 * This is designed to be included in a page, and doesn't have the page framework on its own.
 */

// Global cookie vars
/*
 * Baseurl is overwritten if specified in config
 */
$baseurl=$_SERVER['HOST_NAME'];
require_once('CONFIG.php');

$base=array_slice(explode(".",$baseurl),-2);

/*
 * Cookie names for tracking
 */

$cookiename=implode(".",$base);
$cookieuser=$cookiename."_user";
$cookieauth=$cookiename."_auth";
$cookiealg=$cookiename."_alg";
$cookiepic=$cookiename."_pic";

/*
 * Required inclusions
 */

require_once('handlers/login_functions.php');
require_once('handlers/functions.php');
require_once('handlers/db_hook.php');
require_once('handlers/xml.php');

/*
 * Test the database ...
 */

testDefaults();

$xml=new Xml;
$user=new UserFunctions;

$alt_forms="<div id='alt_logins'>
<!-- OpenID, Google, Twitter, Facebook -->
</div>";
$login_preamble = "
	    <h2>User Login</h2>";
$loginform = "
	    <form id='login' method='post' action='?q=submitlogin'>
	      <label for='username'>
		Email:
	      </label>
	      <input type='email' name='username' id='username' placeholder='user@domain.com' autofocus='autofocus' required='required'/>
	      <br/>
	      <label for='password'>
		Password:
	      </label>
	      <input type='password' name='password' id='password' placeholder='Password' required='required'/>";
$loginform_close="	      <br/>
	      <input type='submit' value='Login' id='login_button'/>
	    </form>$alt_forms<br/><p><small>Don't have an account yet? <a href='login.php?q=create'>Create one</a>!</small></p>";
$big_login=$login_preabmle.$loginform.$loginform_close;
$small_login=$loginform.$loginform_close;
if($_REQUEST['q']=='submitlogin')
  {
    if(!empty($_POST['username']) && !empty($_POST['password']))
      { 
        $res = $user->lookupUser($_POST['username'], $_POST['password'],true);
        if($res[0] !==FALSE)
          {
            // Successful login
            $userdata=$res[1];
            $id=$userdata['id'];
            echo "<h3>Welcome back, ".$xml->getTagContents($userdata['dec_name'],"<fname>")."</h3>"; //Welcome message
		       
            $cookie_result=$user->createCookieTokens($userdata,$title);
            if(!$cookie_result['status']) 
              {
                echo "<div class='error'>".$result['error']."</div>";
              }
            else
              {
                // some secure, easy way to access their name?
                // Need access -- name (id), email. Give server access?
                echo "<p>Logging in from another device or browser will end your session here. You will be redirected in 3 seconds...</p>";
                $logged_in=true;
                ob_end_flush();
                if(isset($_COOKIE[$cookieuser]) || $logged_in===true)
                  {
                    $cookiedebug.=" cookie-enter";
                    // Cookies are set
                    $result=lookupItem($_COOKIE[$cookieuser],'username',null,null,false);
                    if($result!==false)
                      {
                        // good user
                        // Check auth
                        $cookiedebug.=' check-auth '.print_r($_COOKIE[$cookieuser],true);
                        $userdata=mysqli_fetch_assoc($result);
                        $salt=$userdata['salt'];
                        $unique=$userdata['cookie_key'];
                        $ip=$_SERVER['REMOTE_ADDR'];
                        $auth=sha($salt.$unique.$ip,null,'sha512',false);
                        if($auth['hash']==$_COOKIE[$cookieauth])
                          {
                            // Good cookie
                            $cookiedebug.='good auth';
                            $logged_in=true;
                            $user=$_COOKIE[$cookieuser];
                          }
                        else
                          {
                            // bad cookie
                            $cookiedebug.=' bad-auth ('.print_r($cookie_result,true).") for $cookieuser (expecting ".print_r($auth,true)." )<br/>".print_r($_COOKIE);
                            $domain=".".substr($baseurl,strpos($baseurl,'.'));
                            setcookie($cookieuser,false,time()-3600*24*365,null,$domain);
                            setcookie($cookieauth,false,time()-3600*24*365,null,$domain);
                            setcookie($cookiealg,false,time()-3600*24*365,null,$domain);
                            setcookie($cookiealg,false,time()-3600*24*365,null,$domain);
                          }
                      }
                    else
                      {
                        // bad user
                        $cookiedebug.=' bad-user';
                        $domain=".".substr($baseurl,strpos($baseurl,'.'));
                        setcookie($cookiuser,false,time()-3600*24*365,null,$domain);
                        setcookie($cookieauth,false,time()-3600*24*365,null,$domain);
                        setcookie($cookiealg,false,time()-3600*24*365,null,$domain);
                        setcookie($cookiealg,false,time()-3600*24*365,null,$domain);
                      }
                  }
                else 
                  {
                    $logged_in=false;
                    $cookiedebug.='cookies not set for '.$cookiename;
                  }
                //echo $cookiedebug;
                header("Refresh: 0; url=$baseurl"); // was at 3
              }
            //ob_end_flush(); // Flush the buffer, start displaying

            //echo manageFiles('protected/');
          }
        else
          {
            ob_end_flush();
            echo $login_preamble;
            echo "<div class='error'><p>Sorry! <br/>" . $res[1] . "</p><aside class='ssmall'>Did you mean to <a href=''>create a new account instead?</a></aside></div>";
            $failcount=intval($_POST['failcount'])+1;
            $loginform_whole = $loginform."
              <input type='hidden' name='failcount' id='failcount' value='$fail'/>".$loginform_close;


            if($failcount<10) echo $loginform_whole;
            else 
              {
                $result=lookupItem($_POST['username'],'username',null,null,false,true);
                if($result!==false)
                  {
                    $userdata=mysqli_fetch_assoc($result);
                    $id=$userdata['id'];
                  }
                $query="UPDATE `$default_table` SET dtime=".$user->microtime_float()." WHERE id=$id";
                $query2="UPDATE `$default_table` SET disabled=true WHERE id=$id";
                $l=openDB();
                $result1=mysqli_query($l,$query);
                if(!$result1) echo "<p class='error'>".mysqli_error($l)."</p>";
                else 
                  {
                    $result2=execAndCloseDB($l,$query2);
                    if(!$result2) echo "<p class='error'>".mysqli_error($l)."</p>";
                    else
                      {
                        echo "<p>Sorry, you've had ten failed login attempts. Your account has been disabled for 1 hour.</p>";
                      }
                  }
			   
              }
          }
      }
    else
      {
        echo "<h1>Whoops! You forgot something.</h1><h2>Please try again.</h2>";
        echo $loginform.$loginform_close;
      }
  } 
else if($_REQUEST['q']=='create')
  {
    // Create a new user
    // display login form
    // include a captcha and honeypot
    require_once('handlers/recaptchalib.php');
    if(!empty($recaptcha_public_key) && !empty($recaptcha_private_key))
      {

        $recaptcha=recaptcha_get_html($recaptcha_public_key);
        $createform = "
	    <form id='login' method='post' action='?q=create&amp;s=next'>
              <div class='left'>
	      <label for='username'>
		Email:
	      </label>
	      <input type='email' name='username' id='username' autofocus='autofocus'placeholder='user@domain.com' required='required'/>
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
              <label for='name'>
                Name
              </label>
	      <input type='text' name='name' id='name' placeholder='Your full name' required='required'/>
	      <br/>
              <label for='dname'>
                Display name: 
              </label>
	      <input type='text' name='dname' id='dname' placeholder='dinoman12' required='required'/>
	      <br/>
              <label for='honey' class='hide'>
                Do not fill this field
              </label>
	      <input type='text' name='honey' id='honey' class='hide'/>
              $recaptcha
              </div>
              <div class='right' style='width:25%'>
              <p><small>We require a password of at least six characters with at least one upper case letter, at least one lower case letter, and at least one digit or special character. You can also use <a href='http://imgs.xkcd.com/comics/password_strength.png'>any long password</a> of at least 21 characters, with no security requirements.</small></p>
              </div>
              <br class='clear'/>
	      <input type='submit' value='Create' id='createUser_submit' disabled='disabled'/>
	    </form><br class='clear'/>";
        $secnotice="<p>You will have the option after login to store your information encrypted on this server.</p><p><small>Remember your security best practices! Do not use the same password you use for other sites. While your information is encrypted and <a href='http://en.wikipedia.org/wiki/Cryptographic_hash_function' $newwindow>hashed</a> with a multiple-round hash function, <a href='http://arstechnica.com/security/2013/05/how-crackers-make-minced-meat-out-of-your-passwords/' $newwindow>passwords are easy to crack!</a></small></p>";
        $createform.=$secnotice; // comment out if SSL is used.
        $deferredJS.="$('#password').keypress(function(){checkPasswordLive()});\n$('#password').change(function(){checkPasswordLive()});\n$('#password').keyup(function(){checkPasswordLive()});";
        $deferredJS.="$('#password2').keypress(function(){checkMatchPassword()});\n$('#password2').change(function(){checkMatchPassword()});\n$('#password2').keyup(function(){checkMatchPassword()});";

        if($_REQUEST['s']=='next')
          {
            $email_preg="/[a-z0-9!#$%&'*+=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|edu|gov|mil|biz|info|mobi|name|aero|asia|jobs|museum)\b/";
            if(!empty($_POST['honey'])) 
              {
                echo "<p class='error'>Whoops! You tripped one of our bot tests. If you are not a bot, please go back and try again. Read your fields carefully!</p>";
                $_POST['email']='bob';
              }
            $resp = recaptcha_check_answer ($recaptcha_private_key,
            $_SERVER["REMOTE_ADDR"],
            $_POST["recaptcha_challenge_field"],
            $_POST["recaptcha_response_field"]);

            if (!$resp->is_valid) 
              {
                // What happens when the CAPTCHA was entered incorrectly
                die ("The reCAPTCHA wasn't entered correctly. Go back and try it again." .
                "(reCAPTCHA said: " . $resp->error . ")");
              } 
            else 
              {
                // Successful verification
                if(preg_match($email_preg,$_POST['username']))
                  {
                    if($_POST['password']==$_POST['password2'])
                      {
                        if(preg_match('/(?=^.{6,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/',$_POST['password']) || strlen($_POST['password'])>20) // validate email, use in validation to notify user.
                          {
                            $res=$user->createUser($_POST['username'],$_POST['password'],$_POST['name'],$_POST['dname']);
                            if($res[0]) 
                              {
                                $cookie_result=$user->createCookieTokens($res,$title);
                                echo "<h3>".$res[1]."</h3><p>Now, let's flesh out your profile. <a href='edit.php'>Continue &#187;</a>.</p>"; //jumpto1
                                // email user
                                $to=$_POST['username'];
                                $headers  = 'MIME-Version: 1.0' . "\r\n";
                                $headers .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";
                                $headers .= "From: Really Active People <blackhole@reallyactivepeople.com>";
                                $subject='New Account Creation';
                                $body = "<p>Congratulations! Your new account has been created. Your username is this email address ($to). We do not keep a record of your password we can access, so please be sure to remember it!</p><p>If you do forget your password, you can <a href='mailto:support@reallyactivepeople.com?subject=Reset%20Password'>email support</a> to reset your password for you with a picture of government ID with your registered name and zip code. All secure data will be lost in the reset.</p>";
                                if(mail($to,$subject,$body,$headers)) echo "<p>A confirmation email has been sent to your inbox at $to .</p>";
					   
                              }
                            else echo "<p class='error'>".$res[1]."</p><p>Use your browser's back button to try again.</p>";
                            ob_end_flush();
                          }
                        else
                          { 
                            echo "<p class='error'>Your password was not long enough (6 characters) or did not match minimum complexity levels (one upper case letter, one lower case letter, one digit or special character). You can also use <a href='http://imgs.xkcd.com/comics/password_strength.png'>any long password</a> of at least 21 characters. Please go back and try again.</p>";
                          }
                      }
                    else echo "<p class='error'>Your passwords did not match. Please go back and try again.</p>";
                  }
                else echo "<p class='error'>Error: Your email address was invalid. Please enter a valid email.</p>";
              }
          }
        else echo $createform;
      }
  }
else if($_REQUEST['confirm']!=null)
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
            $query="UPDATE `$default_table` SET flag=$flag WHERE id=$id";
            $l=openDB();
            $result=execAndCloseDB($l,$query);
            if(!$result) echo "<p class='error'>" . mysqli_error($l) . "</p>";
            else
              {
                echo "<p>Success! User $status</p>";
                $email=sanitize($_REQUEST['email']);
                $subject='$title account activated';
                $body="<p>This is a notice from $title to let you know your account has been $status.";
                if($status=='activated') $body.=" You may now <a href='".$baseurl."/login.php'>log in here</a></p><p>Thanks!</p>";
                $headers  = 'MIME-Version: 1.0' . "\r\n";
                $headers .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";
                $headers .= "From: $title <blackhole@".substr($baseurl,strpos($baseurl,'.')).">";
                if(mail($email,$subject,$body,$headers)) echo "<p>Additionally, an email was sent to '$email' notifying them of their activation.</p>";
                else echo "<p class='error'>Notice: email notification of activation failed. Please manually notify $email about their activation.</p>";
              }
          }
        else echo "<p class='error'>Invalid user confirmation code.</p>";
      }
    else echo "<p class='error'>Invalid user ID</p>";
  }
else
  {
    echo $login_preamble . $loginform.$loginform_close;
  }
echo "<script type='text/javascript'>
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
        $.getScript('js/base64.js');
        $.getScript('js/user_common.js');
        $(document).ready{function(){
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
        loadScript('//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js',lateJS);
    }
    else lateJS;
}
</script>":
?>
