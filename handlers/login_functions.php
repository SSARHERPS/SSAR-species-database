<?php

class UserFunctions {

  function __construct()
  {
    require_once(dirname(__FILE__).'/../CONFIG.php');
    global $user_data_storage,$profile_picture_storage,$site_security_token,$service_email,$minimum_password_length,$password_threshold_length,$db_cols,$default_user_table,$default_user_database;
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
    $this->supportEmail = $service_email;
    $this->minPasswordLength = $minimum_password_length;
    $this->thresholdLength = $password_threshold_length;
    $this->columns = $db_cols;
    $this->table = $default_user_table;
    $this->db = $default_user_database;
  }

  /***
   * Helper functions
   ***/
  private function getSiteKey() { return $this->siteKey; }
  private function getTable() { return $this->table; }
  private function getDB() { return $this->db; }
  private function getMinPasswordLength() { return $this->minPasswordLength; }
  private function getThresholdLength() { return $this->thresholdLength; }
  private function getSupportEmail() { return $this->supportEmail; }
  private function getColumns() { return $this->columns; }
  public function getUser()
  {
    if(empty($this->user)) $this->setUser();
    return $this->user;
  }
  private function setUser($userdata = null)
  {
    /***
     * Set the user for this object.
     ***/
    $userid = null;
    $this->user = null; // Reset the user
    
    if(!empty($userdata) && is_array($userdata))
      {
        $col = key($userdata);
        $userid = current($userdata);
      }
    else
      {
        $baseurl = 'http';
        if ($_SERVER["HTTPS"] == "on") {$baseurl .= "s";}
        $baseurl .= "://www.";
        $baseurl.=$_SERVER['HTTP_HOST'];                        
        $base=array_slice(explode(".",$baseurl),-2);
        $domain=$base[0];
        $cookielink=$domain."_link";
        $userid=$_COOKIE[$cookielink];
        $col = "dblink";
      }
    if(empty($userid)) return $this->user;
    $result=lookupItem($userid,$col,$this->getTable(),$this->getDB());
    if($result!==false && !is_array($result))
      {
        $userdata=mysqli_fetch_assoc($result);
        if(is_array($userdata))
          {
            $this->user = $userdata;
          }
      }
    return $this->user;
  }
  private function setColumns()
  {
    
  }

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
  
  public function createUser($username,$pw_in,$name,$dname)
  {
    // Send email for validation
    require_once(dirname(__FILE__).'/db_hook.inc');
    $ou=$username;
    /***
     * Weaker, but use if you have problems with the sanitize() function.
     $l=openDB($this->getDB());
     $user=mysqli_real_escape_string($l,$username);
    ***/
    $user=sanitize($username); 
    $preg="/[a-z0-9!#$%&'*+=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[a-z]{2}|com|org|net|edu|gov|mil|biz|info|mobi|name|aero|asia|jobs|museum)\b/";
    /***
     * Uncomment the next line if strict username comparison is needed.
     * Sometimes special characters may be escaped and be OK, so this is left commented out by default.
     ***/
    //if($user!=$username) return array(false,'Your chosen email contained injectable code. Please try again.');
    if(preg_match($preg,$username)!=1) return array(false,'Your email is not a valid email address. Please try again.');
    else $username=$user; // synonymize

    $result=lookupItem($user,'username',$this->getTable(),$this->getDB(),false,true);
    if($result!==false) 
      {
        $data=mysqli_fetch_assoc($result);
        if($data['username']==$username) return array(false,'Your email is already registered. Please try again. Did you forget your password?');
      }
    if(strlen($pw_in) < $this->getMinPasswordLength()) return array(false,'Your password is too short. Please try again.');
    // Complexity checks here, if not relegated to JS ...
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
    $store = array();
    foreach($this->getColumns() as $key=>$type)
      {
        $fields[]=$key;
        switch($key)
          {
          case "username":
            $store[]=$user;
            break;
          case "password":
            $store[]=$pw_store;
            break;
          case "creation":
            $store[]=$creation;
            break;
          case "name":
            $store[]=$names;
            break;
          case "flag":
            // Is the user active, or does it need authentication first?
            // Default "true" means immediately active.
            $store[]=true;
            break;
          case "dtime":
            $store[]=0;
            break;
          case "data":
            $store[]=$data_init;
            break;
          case "secdata":
            $store[]=$sdata_init;
            break;
          case "dblink":
            $store[]=$hardlink;
            break;
          case "admin_flag":
          case "su_flag":
          case "disabled":
            $store[]=false;
            break;
          default:
            $store[]="";
          }
      }
    // $store=array($user,$pw_store,'',$creation,'',$names,true,false,false,false,0,'','','',$data_init,$sdata_init,'','',$hardlink,'','',''); // set flag to FALSE if authentication wanted.
    /***
     * // Debugging
     * echo displayDebug("$user | $username | $ou");
     * echo displayDebug($store);
     ***/ 
    $test_res=addItem($fields,$store,$this->getTable(),$this->getDB());
    if($test_res)
      {
        // Get ID value
        $res = $this->lookupUser($user, $pw_in);
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
        // email 
        $email='blackhole@'.$domain;
        $to='admin@'.$domain;
        $headers  = 'MIME-Version: 1.0' . "\r\n";
        $headers .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";
        $headers .= "From: $name (via $domain) <$email>";
        $subject="[User Signup] New User - $name";
        $body="<p>$name is requesting access to files for $title. You can click the following link to enable access to the files, and click the link later to disable access.</p>\n<p><a href='$validlink'>$validlink</a><p>\n<p>Thank you. For debugging purposes, the user was hashed with $algo.</p>";
        if(mail($to,$subject,$body,$headers))
        {
        //mail($this->supportEmail,$subject,$body,$headers); // debugging confirmation
        return array(true,"Success! You will receive confirmation when your account has been activated.");
        }
        */
        if (is_numeric($id) && !empty($userdata)) 
          {

            $cookies=$this->createCookieTokens($userdata,true);
            
            return array_merge(array(true,'Success!'),$userdata,$cookies);
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
    $result=lookupItem($username,'username',$this->getTable(),$this->getDB(),false); // if lookupItem is well done, can skip the san -- still escapes it
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
                        $query1="UPDATE `".$this->getTable()."` SET disabled=false WHERE id=".$userdata['id'];
                        $res1=openDB($this->getDB());
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
    else return array(false,'message'=>'Sorry, your username or password is incorrect.','error'=>'Bad username','desc'=>$result['error']);
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
    $userdata = $this->getUser();
    if(is_array($userdata))
      {
        $authsalt = $this-> getSiteKey();        
        $pw_characters=json_decode($userdata['password'],true);
        $salt=$pw_characters['salt'];

        if(empty($hash) || empty($secret))
          {
            $baseurl = 'http';
            if ($_SERVER["HTTPS"] == "on") {$baseurl .= "s";}
            $baseurl .= "://www.";
            $baseurl.=$_SERVER['HTTP_HOST'];                        
            $base=array_slice(explode(".",$baseurl),-2);
            $domain=$base[0];
            
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
    else
      {
        // empty result
        if($detail) return array("uid"=>$userid,"col"=>$col,"basis_conf"=>$hash,"have_secret"=>strbool(empty($secret)));
        return false;
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
        $query="UPDATE `".$this->getTable()."` SET auth_key='$otsalt' WHERE id='$id'";
        $l=openDB($this->getDB());
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

        $xml=new Xml;
        $user_greet=$xml->getTagContents($userdata['name'],"<fname>"); // for now
        $dblink=$userdata['dblink'];
    
        setcookie($cookieauth,$value,$expire);
        setcookie($cookiekey,$cookie_secret,$expire);
        setcookie($cookieuser,$username,$expire);
        setcookie($cookieperson,$user_greet,$expire);
        $path=$this->getUserPicture($userdata['id']); 
        setcookie($cookielink,$dblink,$expire);

        $js_expires=",{expires:$expire_days,path:'/'});\n";
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
    if(empty($data) || empty($col)) return array('status'=>false,'error'=>'Bad request');
    $validated=false;
    if(is_array($validation_data))
      {
        if(array_key_exists('dblink',$validation_data))
          {
            // confirm with validateUser();
            $validated=$this->validateUser($validation_data['dblink'],$validation_data['hash'],$validation_data['secret']);
            $method='Confirmation token';
            $where_col='dblink';
            $user=$validation_data['dblink'];
          }
        else if(array_key_exists('password',$validation_data))
          {
            // confirm with lookupUser();
            $a=$this->lookupUser($validation_data['username'],$validation_data['password']);
            $where_col='username';
            $user=$validation_data['username'];
            $validated=$a[0];
            $method='Password';
          }
        else return array('status'=>false,"error"=>"Bad validation data");
      }
    else
      {
        $validated=$this->validateUser();
        $method='Cookie';
        $where_col='dblink';
        $user=$validation_data['dblink'];
      }
    if($validated)
      {
        // write it to the db
        // replace or append based on flag
        require_once(dirname(__FILE__).'/../CONFIG.php');
        $real_col=sanitize($col);
        if(!$replace)
          {
            // pull the existing data ...
            $l=openDB($this->getDB());
            $prequery="SELECT $real_col FROM `".$this->getTable()."` WHERE $where_col='$user'";
            // Look for relevent JSON entries or XML entries and replace them
            $r=mysqli_query($l,$prequery);
            $row=mysqli_fetch_row($r);
            $d=$row[0];
            $jd=json_decode($d,true);
            if($jd==null)
              {
                // XML -- only takes one tag in!!
                require_once(dirname(__FILE__).'/xml.php');
                $xml_data=explode("</",$data);
                $tag=array_pop($xml_data);
                $tag=sanitize(substr($tag,0,-1));
                $tag="<".$tag.">";
                $xml= new Xml;
                $tag_data=$xml->getTagContents($data,$tag);
                $clean_tag_data=sanitize($tag_data);
                $new_data=$xml->updateTag($d,$tag,$tag_data);
              }
            else
              {
                $jn=json_decode($data,true);
                foreach($jn as $k=>$v)
                  {
                    $ck=sanitize($k);
                    $cv=sanitize($v);
                    $jd[$ck]=$cv;
                  }
                $new_data=json_encode($jd);
              }
            $real_data=mysqli_real_escape_string($l,$new_data);
          }
        else $real_data=sanitize($data);

        if(empty($real_data)) return array('status'=>false,'error'=>'Invalid input data (sanitization error)');
        $query="UPDATE `".$this->getTable()."` SET $real_col=\"".$real_data."\" WHERE $where_col='$user'";
        $l=openDB($this->getDB());
        mysqli_query($l,'BEGIN');
        $r=mysqli_query($l,$query);
        $finish_query= $r ? 'COMMIT':'ROLLBACK';
        $r2=mysqli_query($l,$finish_query);
        return array('status'=>$r,'data'=>$data,'col'=>$col,'action'=>$finish_query,'result'=>$r2,'method'=>$method);
      }
    else return array('status'=>false,'error'=>'Bad validation','method'=>$method);
  }

  public function resetUserPassword()
  {
    /***
     * Set up the password reset functionality.
     * Without a flag, just send an email to the address on file with a reset link.
     * With a flag, validate the new password data and reset authentication, then invoke changeUserPassword().
     ***/
  }

  public function doUpdatePassword()
  {
    /***
     * If the user requested to update their password, do a check on their
     * authentication, then invoke changeUserPassword()
     ***/
  }

  private function changeUserPassword($isResetPassword = false)
  {
    /***
     * Replace the password stored.
     * If there are any encrypted fields, decrypt them and re-encrypt them in the process.
     * Trash the encrypted fields if we're resetting.
     * Update the cookies.
     ***/
  }

  public function textUserVerify()
  {
    /***
     * Send a text message to a user's stored phone, and 
     * save the authentication string provided.
     ***/
  }

  public function requireUserAuth()
  {
    /***
     * Set up the flags and verification tokens to disable a user until the authorization flag is passed
     * The user calling this function themselves needs an admin flag and must be logged in.
     ***/
  }

  public function verifyUserAuth()
  {
    /***
     * If a user needs to be authorized before being allowed access,
     * check the authorization token here and update the flag
     ***/
  }

}
?>