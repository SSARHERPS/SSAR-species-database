<?php

class UserFunctions {

  function __construct()
  {
    require_once(dirname(__FILE__).'/../CONFIG.php');
    global $user_data_storage,$profile_picture_storage,$site_security_token;
    if(!empty($user_data_storage))
      {
        $user_data_storage .= substr($user_data_storage,-1)=="/" ? '':'/';
        $this->data_path=$user_data_storage;
      }
    else $this->data_path = "userdata/";

    if(!empty($profile_picture_storage))
      {
        $profile_picture_storage .= substr($profile_picture_storage,-1)=='/' ? '':'/';
        $this->picture_path = $this->data_path . $profile_picture_storage;
      }
    else $this->picture_path = $this->data_path . "profilepics/";

    $this->siteKey = $site_security_token;
  }

  /***
   * Helper functions
   ***/
  private function getSiteKey() { return $this->siteKey; }

  public function microtime_float()
  {
    list($usec, $sec) = explode(" ", microtime());
    return ((float)$usec + (float)$sec);
  }

  private function strbool($bool)
  {
    // returns the string of a boolean as 'true' or 'false'.
    if(is_string($bool)) $bool=boolstr($bool); // if a string is passed, convert it to a bool
    if(is_bool($bool)) return $bool ? 'true' : 'false';
    else return 'non_bool';
  }

  /***
   * Primary functions
   ***/
  
  public function createUser($username,$pw_in,$name,$dname,$zip=null)
  {
    // Send email for validation
    require_once(dirname(__FILE__).'/db_hook.inc');
    $user=sanitize($username); 
    $preg="/[a-z0-9!#$%&'*+=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|edu|gov|mil|biz|info|mobi|name|aero|asia|jobs|museum)\b/";
    /***
     * Uncomment the next line if strict username comparison is needed
     ***/
    //if($user!=$username) return array(false,'Your chosen email contained injectable code. Please try again.');
    if(preg_match($preg,$username)!=1) return array(false,'Your email is not a valid email address. Please try again.');
    else $username=$user; // synonymize
    $result=lookupItem($user,'username',null,null,false,true);
    if($result!==false) 
      {
        $data=mysqli_fetch_assoc($result);
        if($data['username']==$username) return array(false,'Your email is already registered. Please try again. Did you forget your password?');
      }
    require_once(dirname(__FILE__).'/../CONFIG.php');
    global $minimum_password_length,$password_threshold_length;
    if(strlen($pw_in)<$minimum_password_length) return array(false,'Your password is too short. Please try again.');
    require_once(dirname(__FILE__).'/../stronghash/php-stronghash.php');
    $hash=new Stronghash;
    $creation=$this->microtime_float();
    $pw1=$hash->hasher($pw_in);
    $pw_store=json_encode($pw1);
    $algo=$pw1['algo'];
    $salt=$pw1['salt'];
    if(!empty($pw1['rounds'])) $rounds="<rounds>".$pw1['rounds']."</rounds>";
    $data_init="<xml><algo>$algo</algo>$rounds</xml>";
    $ne=encryptThis($name,$pw_in,$salt); // only encrypt if requested, then put in secdata
    $sdata_init="<xml><name>".$ne[0]."</name></xml>";
    $names="<xml><name>".implode(" ",$name)."</name><fname>".$name[0]."</fname><lname>".$name[1]."</lname><dname>$dname</dname></xml>";
    $hardlink=sha1($salt.$creation);
    //echo "<pre>Storing:\n";
    $fields=array('username','password','pass_meta','creation','status_tracker','name','flag','admin_flag','su_flag','disabled','dtime','auth_key','data','secdata','special_1','special_2','dblink','defaults','public_key','private_key');
    //print_r($fields);
    //echo "\nwith the following information\n";
    $store=array($user,$pw_store,'',$creation,'',$names,true,false,false,false,0,'',$data_init,$sdata_init,'','',$hardlink,'','',''); // set flag to FALSE if authentication wanted.
    //print_r($store);
    $test_res=addItem($fields,$store);
    if($test_res)
      {
        // Get ID value
        $res = $this->lookupUser($username, $pw_in);
        $userdata=$res[1];
        $id=$userdata['id'];
        
        /* Uncomment if authentication has been requested */
        /*
        // Create hash - user + encrypted name + salt
        $ne=$ne[0];
        $hash=sha1($user.$ne.$salt);
        $validlink=$baseurl."/login.php?confirm=$hash&amp;token=$creation&amp;lookup=$id";
        $affix="&amp;email=".htmlentities($email_in);
        $validlink.=$affix;
        // email jen
        $email='blackhole@'.substr($baseurl,strpos($baseurl,'.'));
        $to='admin@'.substr($baseurl,strpos($baseurl,'.'));
        $headers  = 'MIME-Version: 1.0' . "\r\n";
        $headers .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";
        $headers .= "From: $name (via $domain) <$email>";
        $subject="[User Signup] New User - $name";
        $body="<p>$name is requesting access to files for $title. You can click the following link to enable access to the files, and click the link later to disable access.</p>\n<p><a href='$validlink'>$validlink</a><p>\n<p>Thank you. For debugging purposes, the user was hashed with $algo.</p>";
        if(mail($to,$subject,$body,$headers))
        {
        //mail('support@velociraptorsystems.com',$subject,$body,$headers); // debugging confirmation
        return array(true,"Success! You will receive confirmation when your account has been activated.");
        }
        */
        if (is_numeric($id) && !empty($userdata)) 
          {

            $this->createCookieTokens($userdata,true);
            
            return array_merge(array(true,'Sucess!'),$userdata);
          }
        else return array(false,'Failure: Unable to verify user creation');
      }
    else return array(false,'Failure: unknown database error. Your user was unable to be saved.');
  }

  public function lookupUser($username,$pw,$return=true)
  {
    // check it's a valid email! validation skipped.
    require_once(dirname(__FILE__).'/xml.php');
    $xml=new Xml;
    require_once(dirname(__FILE__).'/db_hook.inc');
    $result=lookupItem($username,'username',null,null,false);
    $userdata=mysqli_fetch_assoc($result);
    if($result!==false && is_numeric($userdata['id']))
      {
        // check password
        require_once(dirname(__FILE__).'/../stronghash/php-stronghash.php');
        $hash=new Stronghash;
        $data=json_decode($userdata['password'],true);
        if($hash->verifyHash($pw,$data))
          {
            if($userdata['flag'] && !$userdata['disabled']) 
              {
                //This user is OK and not disabled, nor pending validation
                if(!$return) 
                  {
                    //Return decrypted userdata, if applicable
                    $decname=decryptThis($userdata['name'],$pw,$salt);
                    if(empty($decname))$decname=$userdata['name'];
                    return array(true,$decname);
                  }
                else 
                  {
                    $decname=decryptThis($userdata['name'],$pw,$salt);
                    if(empty($decname))$decname=$userdata['name'];
                    $returning=array(true,$userdata);
                    return $returning;
                  }
              }
            else 
              {
                if(!$userdata['flag'])return array(false,'Your login information is correct, but your account is still being validated, or has been disabled. Please try again later.');
                if($userdata['disabled'])
                  {
                    // do a time check
                    if($userdata['dtime']+3600>$this->microtime_float()) 
                      {
                        $rem=intval($userdata['dtime'])-intval($this->microtime_float())+3600;
                        $min=$rem%60;
                        $sec=$rem-60*$min;
                        return array(false,'message'=>'Your account has been disabled for too many failed login attempts. Please try again in '.$min.' minutes and '.$sec.' seconds.');
                      }
                    else 
                      {
                        // Clear login disabled flag
                        global $default_table;
                        $query1="UPDATE `$default_table` SET disabled=false WHERE id=".$userdata['id'];
                        $res1=openDB();
                        $result=execAndCloseDB($query1);
                      }
                  }
                // All checks passed.
                if(!$return) 
                  {
                    $decname=decryptThis($userdata['name'],$pw,$salt);
                    if(empty($decname))$decname=$userdata['name'];
                    return array(true,$decname);
                  }
                else 
                  {
                    $decname=decryptThis($userdata['name'],$pw,$salt);
                    if(empty($decname))$decname=$userdata['name'];
                    $returning=array(true,$userdata);
                    return $returning;
                  }
              }
          }
        else
          {
            return array(false,'message'=>'Sorry, your username or password is incorrect.','error'=>'Bad Password');
          }
        // end good username loop 
      }
    else return array(false,'meassage'=>'Sorry, your username or password is incorrect.','error'=>'Bad username');
  }


  public function getUserPicture($id,$path=null,$extra_types_array=null)
  {
    if(empty($path)) $path=$this->picture_path;
    else $path.= substr($path,-1)=='/' ? '':'/';
    $valid_ext=array('jpg','jpeg','png','bmp','gif','svg');
    if(is_array($extra_types_array)) $valid_ext = array_merge($extra_types_array);
    foreach($valid_ext as $ext)
      {
        $file=$id.".".$ext;
        if(file_exists($path.$file)) return $path.$file;
      }
    return $path."default.jpg";
  }

  public function validateUser($userid=null,$hash=null,$secret=null,$detail=false)
  {
    /***
     * Returns true or false based on user validation
     *
     * Requires:
     * 1) a device that has logged in (via a cookie-based secret)
     * 2) is originating at the same IP address
     * 3) Pinged server has correct config file
     * 4) Has database value
     *
     * Can be spoofed with inspected code at the same IP
     ***/
    $baseurl = 'http';
    if ($_SERVER["HTTPS"] == "on") {$baseurl .= "s";}
    $baseurl .= "://www.";
    $baseurl.=$_SERVER['HTTP_HOST'];
            
    require_once(dirname(__FILE__).'/../CONFIG.php');
            
    $base=array_slice(explode(".",$baseurl),-2);
    $domain=$base[0];
    $cookielink=$domain."_link";
    
    $col='dblink';
    if(empty($userid)) $userid=$_COOKIE[$cookielink];
    $result=lookupItem($userid,$col);
    if($result!==false && !is_array($result))
      {
        $authsalt = $this-> getSiteKey();
        $userdata=mysqli_fetch_assoc($result);
        if(!is_array($userdata))
          {
            // empty result
            if($detail) return array("uid"=>$userid,"col"=>$col,"basis_conf"=>$hash,"have_secret"=>strbool(empty($secret)));
            return false;
          }
        $pw_characters=json_decode($userdata['password'],true);
        $salt=$pw_characters['salt'];

        if(empty($hash) || empty($secret))
          {
            
            $cookiekey=$domain."_secret";
            $cookieauth=$domain."_auth";

            $secret=$_COOKIE[$cookiekey];
            $hash=$_COOKIE[$cookieauth];
            $from_cookie=true;
            if(empty($hash) || empty($secret))
              {
                if($detail) return array("uid"=>$userid,"salt"=>$salt,"calc_conf"=>$conf,"basis_conf"=>$hash,"have_secret"=>strbool(empty($secret)),"from_cookie"=>strbool($from_cookie));
                return false;
              }
          }
        else $from_cookie=false;
        
        $value_create=array($secret,$salt,$userdata['auth_key'],$_SERVER['REMOTE_ADDR'],$authsalt); 
        $conf=sha1(implode('',$value_create));
        $state= $conf==$hash ? true:false;
        if($detail) return array('state'=>strbool($state),"uid"=>$userid,"salt"=>$salt,"calc_conf"=>$conf,"basis_conf"=>$hash,"from_cookie"=>strbool($from_cookie),'got_user_pass_info'=>is_array($pw_characters),'got_userdata'=>is_array($userdata),'source'=>$value_create);
        return $state;
      }
    if($detail)
      {
        $detail=array("uid"=>$userid,'col'=>$col,"basis_conf"=>$hash,"have_secret"=>strbool(empty($secret)));
        if(is_array($result)) $detail['error']=$result['error'];
        return $detail;
      }
    return false;
  }

  public function createCookieTokens($username,$password_or_is_data=true)
  {
    try
      {
        if($password_or_is_data===true)
          {
            $userdata=$username;
            $username=$userdata['username'];
          }
        else
          {
            $r = $this->lookupUser($username,$password_or_is_data);
            if($r[0]===false) return array(false,'status'=>false,'error'=>"<p>Bad user credentials</p>","username"=>$username);
            $userdata=$r[1];
          }
        $id=$userdata['id'];
        //Set a cookie
        $baseurl = 'http';
        if ($_SERVER["HTTPS"] == "on") {$baseurl .= "s";}
        $baseurl .= "://www.";
        $baseurl.=$_SERVER['HTTP_HOST'];

        require_once(dirname(__FILE__).'/../CONFIG.php');

        $base=array_slice(explode(".",$baseurl),-2);
        $domain=$base[0];
        $shorturl=implode(".",$base);

        $expire_days=7;
        $expire=time()+3600*24*$expire_days;
        // Create a one-time key, store serverside
        require_once(dirname(__FILE__).'/../stronghash/php-stronghash.php');
        require_once(dirname(__FILE__).'/db_hook.inc');
        $hash=new Stronghash;
        $otsalt=$hash->createSalt();
        $cookie_secret=$hash->createSalt();
        $pw_characters=json_decode($userdata['password'],true);
        $salt=$pw_characters['salt'];
        //store it
        global $default_table;
        $query="UPDATE `$default_table` SET auth_key='$otsalt' WHERE id='$id'";
        $l=openDB();
        mysqli_query($l,'BEGIN');
        $result=mysqli_query($l,$query);
        if(!$result)
          {
            $r=mysqli_query($l,'ROLLBACK');
            return array(false,'status'=>false,'error'=>"<p>".mysqli_error($l)."<br/><br/>ERROR: Could not update login state.</p>");
          }
        else $r=mysqli_query($l,'COMMIT');
        
        $value_create=array(
          'secret'=>$cookie_secret,
          'salt'=>$salt,
          'server_salt'=>$otsalt,
          'ip'=>$_SERVER['REMOTE_ADDR'],
          'server_key'=>$this->getSiteKey()
        ); 

        // authenticated since last login. Nontransposable outside network.
    
        $value=sha1(implode('',$value_create));

        $cookieuser=$domain."_user";
        $cookieperson=$domain."_name";
        $cookieauth=$domain."_auth";
        $cookiekey=$domain."_secret";
        $cookiepic=$domain."_pic";
        $cookielink=$domain."_link";

        $user_greet=$userdata['name'];
        $dblink=$userdata['dblink'];
    
        setcookie($cookieauth,$value,$expire);
        setcookie($cookiekey,$cookie_secret,$expire);
        setcookie($cookieuser,$username,$expire);
        setcookie($cookieperson,$user_greet,$expire);
        $path=$this->getUserPicture($userdata['id']); 
        setcookie($cookielink,$dblink,$expire);

        $js_expires="{expires:$expire_days,path:'/'});\n";
        $jquerycookie="$.cookie('$cookieauth','$value'".$js_expires;
        $jquerycookie.="$.cookie('$cookiekey','$cookie_secret'".$js_expires;
        $jquerycookie.="$.cookie('$cookieuser','$username'".$js_expires;
        $jquerycookie.="$.cookie('$cookieperson','$user_greet'".$js_expires;
        $jquerycookie.="$.cookie('$cookiepicture','$path'".$js_expires;
        $jquerycookie.="$.cookie('$cookielink','$dblink'".$js_expires;
    
        return array(
          'status'=>true,
          'user'=>"{ '$cookieuser':'$username'}",
          'auth'=>"{'$cookieauth':'$value'}",
          'secret'=>"{'$cookiekey':'$cookie_secret'}",
          'pic'=>"{'$cookiepic':'$path'}",
          'name'=>"{'$cookieperson':'$user_greet'",
          'name'=>"{'$cookielink':'$dblink'",
          'js'=>$jquerycookie,
          'source'=>$value_create,
          'raw_auth'=>$value
        );
      }
    catch(Exception $e)
      {
        return array('status'=>false,'error'=>"Unexpected exception: $e");
      }
  }


  public function writeToUser($data,$col,$validation_data=null,$replace=true)
  {
    $validated=false;
    if(is_array($validation_data))
      {
        if(array_key_exists('dblink',$validation_data))
          {
            // confirm with validateUser();
            $validated=$this->validateUser($validation_data['dblink'],$validation_data['hash'],$validation_data['secret']);
          }
        else if(array_key_exists('password',$validation_data))
          {
            // confirm with lookupUser();
            $a=$this->lookupUser($validation_data['username'],$validation_data['password']);
            $validated=$a[0];
          }
        else return array('status'=>false,"error"=>"Bad validation data");
      }
    else $validated=$this->validateUser();
    if($validated)
      {
        // write it to the db
        // replace or append based on flag
        if(!$replace)
          {
            // pull the existing data ...
            // Look for relevent JSON entries or XML entries and replace them
            // Otherwise append
          }
        $real_data=sanitize($data);
        require_once(dirname(__FILE__).'/../CONFIG.php');
        global $default_table;
        $query="UPDATE `$default_table` SET $col=\"".$real_data."\"";
        $l=openDB();
        mysqli_query($l,'BEGIN');
        $r=mysqli_query($l,$query);
        $finish_query= $r ? 'COMMIT':'ROLLBACK';
        $r2=mysqli_query($l,$finish_query);
        return array('status'=>$r,'data'=>$data,'col'=>$col,'action'=>$finish_query,'result'=>$r2);
      }
    else return array('status'=>false,'error'=>'Bad validation');
  }
  
}
?>