<?php

use Base32\Base32;

require_once(dirname(__FILE__)."/DBHelper.php");

class UserFunctions extends DBHelper
{

  public function __construct($username = null, $lookup_column = null, $db_params = null)
  {
    /***
     * @param string $username the user to be instanced with
     * @param string $lookup_column the column to look them up in. Ignored if $username is null.
     * @param array $db_params Optional override database parameters.
     *                         The required keys are:
     *                         (string)"user" for SQL username,
     *                         (string)"database" as the SQL database,
     *                         and (string)"password" for SQL password,
     *                         with optional keys
     *                         (string)"url" (defaults to "localhost")
     *                         and (array)"cols" of type "column_name"=>"type".
     ***/
    # Set up the parameters in CONFIG.php
    require_once(dirname(__FILE__).'/../CONFIG.php');
    global $user_data_storage,$profile_picture_storage,$site_security_token,$service_email,$minimum_password_length,$password_threshold_length,$db_cols,$default_user_table,$default_user_database,$password_column,$cookie_ver_column,$user_column,$totp_column,$totp_steps,$temporary_storage,$needs_manual_authentication,$totp_rescue,$ip_record,$default_user_database,$default_sql_user,$default_sql_password,$sql_url,$default_user_table;

    if(!empty($db_params))
      {
        if(!is_array($db_params))
          {
            throw(new Exception("Invalid argument type for \$db_params"));
          }
        if(sizeof($db_params) != 4 || sizeof($db_params) != 3)
          {
            throw(new Exception("Bad database initialization parameters."));
          }
        $must_have = array("user","database","password");
        if(array_key_exists("url",$db_params)) $sql_url = $db_params["url"];
        if(array_key_exists("cols",$db_params)) $db_cols = $db_params["cols"];
        foreach($must_have as $key)
          {
            if(!array_key_exists($key,$db_params))
              {
                throw(new Exception("Bad database initialization parameters."));
              }
            switch($key)
              {
              case "user":
                $default_sql_user = $db_params[$key];
                break;
              case "database":
                $default_user_database = $db_params[$key];
                break;
              case "password":
                $default_sql_password = $db_params[$key];
                break;
              default:
                throw(new Exception("Unknown key '$key' in database initialization parameters."));
              }
          }
      }
    # Configure the database
    $this->setSQLUser($default_sql_user);
    $this->setDB($default_user_database);
    $this->setSQLPW($default_sql_password);
    $this->setSQLURL($sql_url);
    $this->setCols($db_cols);
    $this->setTable($default_user_table);

    # Check it
    if(!$this->testSettings())
      {
        # There's a database problem
        throw(new Exception("Database configuration problem"));
      }

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
    $this->pwcol = $password_column;
    $this->cookiecol = $cookie_ver_column;
    $this->usercol = $user_column;
    $this->tmpcol = $temporary_storage;
    $this->totpcol = $totp_column;
    $this->totpbackup = $totp_rescue;
    $this->totpsteps = $totp_steps;
    $this->needsAuth = $needs_manual_authentication;
    $this->ipcol = $ip_record;

    $baseurl = 'http';
    if ($_SERVER["HTTPS"] == "on") {$baseurl .= "s";}
    $baseurl .= "://www.";
    $baseurl.=$_SERVER['HTTP_HOST'];
    $base=array_slice(explode(".",$baseurl),-2);
    $domain=$base[0];

    $this->domain = $domain;

    # Let's be nice and try to set up a user
    try
      {
        if(!empty($username))
          {
            # We're initiating a specified user
            $key = empty($lookup_column) ? $this->usercol:$lookup_column;
            $this->getUser(array($key=>$username));
          }
        else $this->getUser();
      }
    catch(Exception $e)
      {
        # If we tried on our own, let's do nothing; if it was user specified, re-throw it
        if(!empty($username)) throw(new Exception($e->getMessage()));
      }
  }


  /***
   * Helper functions
   ***/

  private function getSiteKey() { return $this->siteKey; }
  private function getMinPasswordLength() { return $this->minPasswordLength; }
  private function getThresholdLength() { return $this->thresholdLength; }
  private function getSupportEmail() { return $this->supportEmail; }
  private function needsManualAuth() { return $this->needsAuth === true; }
  private function getSecret($is_test = false) {
    $userdata = $this->getUser();
    if($is_test)
      {
        return empty($userdata[$this->tmpcol]) ? false:$userdata[$this->tmpcol];
      }
    return empty($userdata[$this->totpcol]) ? false:$userdata[$this->totpcol];
  }
  public function has2FA() {
    $userdata = $this->getUser();
    return !empty($userdata[$this->totpcol]);
  }
  public function getUser($user_id = null)
  {
    /***
     * Get the user, and assign one if it hasn't been assigned already
     *
     * @param string|array $user_id Either a column/value pair or an ID for the default column
     * @return array of the user result column
     ***/

    if(empty($this->user) || !empty($user_id)) $this->setUser($user_id);
    $userdata = $this->user;
    if(!array($userdata))
      {
        if(empty($userdata))
          {
            # Couldn't get the user in any automated way
            $error = "Unable to retrieve user";
          }
        else
          {
            # The user was bad
            $error = "Bad user provided - ";
            if(is_string($userdata)) $error .= $userdata;
            else if(is_array($userdata)) $error .= current($userdata)." of type ".key($userdata);
            else $error .= "unrecognized type";
          }
        throw(new Exception($error));
      }

    if(array_key_exists($this->usercol,$userdata)) $this->username = $userdata[$this->usercol];
    return $userdata;
  }

  private function setUser($user_id = null)
  {
    /***
     * Set the user for this object. Always overwrites current user.
     * Only intended to be called by getUser()
     *
     * @param string|array $user_id Either a column/value pair or an ID for the default column
     ***/

    if(!empty($user_id) && is_array($user_id) && sizeof($user_id) == 1)
      {
        # Specified as a column/value pair
        $col = key($user_id);
        $user_id = current($user_id);
      }
    else if(!empty($user_id) && !is_array($user_id))
      {
        # Just a id with the default column
        $col = $this->usercol;
      }
    else if(!empty($_COOKIE[$this->domain."_link"]))
      {
        # See if we can get this from the cookies
        $user_id=$_COOKIE[$this->domain."_link"];
        $col = "dblink";
      }

    # Do we have an ID to work with?
    if(empty($user_id) || empty($col))
      {
        # We couldn't get it from direct assignment or cookies
        throw(new Exception("Unable to set user for ".$col."=>".$user_id."."));
      }

    # Inputs are sanitized in lookupItem
    $result=$this->lookupItem($user_id,$col);
    if($result!==false && !is_array($result))
      {
        $userdata=mysqli_fetch_assoc($result);
        if(is_array($userdata))
          {
            $this->user = $userdata;
          }
      }
    if(!is_array($this->user))
      {
        # Bad query - let getUser() handle it
        $this->user = null;
      }
  }

  private function getDigest()
  {
    $allowed_digest = array(
      "md5",
      "sha1",
      "sha256",
      "sha512"
    );
    if(!in_array($this->totpdigest,$allowed_digest)) return "sha1";
    return $this->totpdigest;
  }

  public static function microtime_float()
  {
    list($usec, $sec) = explode(" ", microtime());
    return ((float)$usec + (float)$sec);
  }

  public static function strbool($bool)
  {
    // returns the string of a boolean as 'true' or 'false'.
    if(is_string($bool)) $bool=boolstr($bool); // if a string is passed, convert it to a bool
    if(is_bool($bool)) return $bool ? 'true' : 'false';
    else return 'non_bool';
  }


  public static function doLoadOTP()
  {
    require_once(dirname(__FILE__).'/../totp/lib/OTPHP/OTPInterface.php');
    require_once(dirname(__FILE__).'/../totp/lib/OTPHP/OTP.php');
    require_once(dirname(__FILE__).'/../totp/lib/OTPHP/TOTPInterface.php');
    require_once(dirname(__FILE__).'/../totp/lib/OTPHP/TOTP.php');
  }


  public function checkTOTP($provided)
  {
    return $this->verifyTOTP($provided);
  }

  private function verifyTOTP($provided,$is_test = false)
  {
    /***
     * Check the TOTP code provided by the user
     *
     * @param int $provided Provided OTP passcode
     * @param bool $is_test if it's a test run, check the temporary rather than real column.
     * @return bool
     ***/
    require_once(dirname(__FILE__).'/../base32/src/Base32/Base32.php');

    self::doLoadOTP();
    $secret = $this->getSecret($is_test);
    if($secret === false) return false;
    try
      {
        $totp = new OTPHP\TOTP($secret);
        $totp->setDigest($this->getDigest());
        if($totp->verify($provided)) return true;
        if(!is_numeric($this->totpsteps)) throw(new Exception("Bad TOTP step count"));
        $i = 1;
        while($i <= $this->totpsteps)
          {
            $test = array();
            $test[] = $totp->now();
            $test[] = $totp->at(time()+30*$i);
            $test[] = $totp->at(time()-30*$i);
            $i++;
            # Check on every iteration. It'll usually be faster.
            if(in_array($provided,$test)) return true;
          }
        return false;
      }
    catch(Exception $e)
      {
        throw(new Exception("Bad parameters provided to verifyOTP :: ".$e->getMessage()));
      }
  }

  public function makeTOTP($provider = null)
  {
    /***
     * Assign a user a multifactor authentication code
     *
     * @param string $provider The provider giving 2FA.
     * @return array with the status in the key "status", errors in "error" and "human_error",
     * username in "username", and provisioning data in "uri"
     ***/
    if(empty($this->username))
      {
        $this->getUser();
        # We MUST have this properly assigned
        if(empty($this->username))
          {
            return array("status"=>false,"error"=>"Unable to get user.");
          }
      }
    if($this->getSecret() !== false)
      {
        return array("status"=>false,"error"=>"2FA has already been enabled for this user.","human_error"=>"You've already enabled 2-factor authentication.","username"=>$this->username);
      }
    try
      {
        require_once(dirname(__FILE__).'/../stronghash/php-stronghash.php');
        $salt = Stronghash::createSalt(12);
        require_once(dirname(__FILE__).'/../base32/src/Base32/Base32.php');
        $secret = Base32::encode($salt);
        ## The resulting provisioning URI should now be sent to the user
        ## Flag should be set server-side indicating the change id pending
        $l=$this->openDB();
        $query = "UPDATE `".$this->getTable()."` SET `".$this->tmpcol."`='$secret' WHERE `".$this->usercol."`='".$this->username."'";
        $r = mysqli_query($l,$query);
        if($r === false)
          {
            return array("status"=>false,"human_error"=>"Database error","error"=>mysqli_error($l));
          }
        # The data was saved correctly
        # Let's create the provisioning stuff!

        self::doLoadOTP();
        $totp = new OTPHP\TOTP($secret);
        $totp->setDigest($this->getDigest());
        $totp->setLabel($this->username);
        $totp->setIssuer($provider);
        $uri = $totp->getProvisioningURI($label,$provider);
        $unsafe_uri = urldecode($uri);
        $secret_part = explode("secret=",$unsafe_uri);
        $iphone32 = str_replace("=","",$secret_part[1]);
        $iphone_uri = $secret_part[0]."secret=".$iphone32; #still no good
        $retarr = self::generateQR($uri);

        # Let's get a human-readable secret
        $human_secret0 = str_replace("=","",$secret);
        $i=0;
        $human_secret = "";
        foreach(str_split($human_secret0) as $char)
          {
            $human_secret .= $char;
            $i++;
            if($i == 4)
              {
            $human_secret .= " ";
            $i=0;
          }
          }
        $retarr["secret"] = $secret;
        $retarr["human_secret"] = $human_secret;
        $retarr["username"] = $this->username;
        return $retarr;
      }
    catch(Exception $e)
      {
        return array("status"=>false,"human_error"=>"Unexpected error in makeTOTP","error"=>$e->getMessage(),"username"=>$this->username,"provider"=>$provider,"label"=>$totp->getLabel(),"uri"=>$uri,"secret"=>$secret);
      }
  }

  public function saveTOTP($code)
  {
    /***
     * Read the tentative secret and make it real
     *
     * @params int $code Provided TOTP code at prompt
     * @return array
     ***/

    if($this->verifyTOTP($code,true))
      {
        # If it's good, make the secret "real" in the $this->totpcol
        $userdata = $this->getUser();
        $secret = $userdata[$this->tmpcol];
        $query = "UPDATE `".$this->getTable()."` SET `".$this->totpcol."`='$secret', `".$this->tmpcol."`=''  WHERE `".$this->usercol."`='".$this->username."'";
        require_once(dirname(__FILE__).'/../stronghash/php-stronghash.php');
        $backup = Stronghash::createSalt();
        $backup_store = hash("sha512",$backup);
        $query2 = "UPDATE `".$this->getTable()."` SET `".$this->totpbackup."`='$backup_store' WHERE `".$this->usercol."`='".$this->username."'";
        $l = $this->openDB();
        mysqli_query($l,"BEGIN");
        $r = mysqli_query($l,$query);
        if($r === false)
          {
            $e = mysqli_error($l);
            mysqli_query($l,"ROLLBACK");
            return array("status"=>false,"error"=>$e,"human_error"=>"Could not save secret","username"=>$this->username);
          }
        $r = mysqli_query($l,$query2);
        if($r === false)
          {
            $e = mysqli_error($l);
            mysqli_query($l,"ROLLBACK");
            return array("status"=>false,"error"=>$e,"human_error"=>"Could not create backup code","username"=>$this->username);
          }
        mysqli_query($l,"COMMIT");
        # Let the user know
        return array("status"=>true,"username"=>$this->username,"backup"=>$backup);
      }
    else
      {
        # The code is wrong, feed back to the user
        return array("status"=>false,"error"=>"0","human_error"=>"Invalid code.");
      }

  }

  public function removeTOTP($username,$password,$code)
  {
    /***
     * Remove two factor authentication
     *
     * @param string $username
     * @param string $password
     * @param string $code Either the Authenticator code, or previously generated backup code.
     * @return bool|array true if success, array if failure
     ***/
    $l = $this->openDB();
    $verify = $this->lookupUser($username,$password);
    # Verify will always be false; but let's see if "error" is also false.
    if($verify['totp']!==true)
      {
        # Either the user doesn't have it, or the credentials are bad
        if($verify[0]===true)
          {
            # Credentials are fine
            return array("status"=>false,"error"=>"Invalid operation","human_error"=>"You don't have two-factor authentication turned on");
          }
        else
          {
            return array("status"=>false,"error"=>"Bad credentials","result"=>$verify,"human_error"=>"Sorry, bad username or password.");
          }
      }
    # Check code for length, if it's long it's the backup
    if(strlen($code)>6)
      {
        # Check against $this->totpbackup
        $query = "SELECT `".$this->totpbackup."` FROM `".$this->getTable()."` WHERE `".$this->usercol."`='".$this->username."'";
        $r = mysqli_query($l,$query);
        if($r === false)
          {
            return array("status"=>false,"error"=>mysqli_error($l),"human_error"=>"Database error");
          }
        $row = mysqli_fetch_row($r);
        $hash = hash("sha512",$code);
        if($hash !== $row[0])
          {
            return array("status"=>false,"error"=>"Bad backup code","human_error"=>"The backup code you entered was invalid. Please try again.");
          }
      }
    else
      {
        # Verify the code
        if(!$this->verifyTOTP($code))
          {
            return array("status"=>false,"error"=>"Bad TOTP code","human_error"=>"The code you entered was invalid. Please try again.");
          }
      }
    # Unset backup and totpcol
    $query = "UPDATE `".$this->getTable()."` SET `".$this->totpcol."`='', `".$this->tmpcol."`='', `".$this->totpbackup."`='' WHERE `".$this->usercol."`='".$this->username."'";
    mysqli_query($l,"BEGIN");
    $r = mysqli_query($l,$query);
    if($r === false)
      {
        $e = mysqli_error($l);
        mysqli_query($l,"ROLLBACK");
        return array("status"=>false,"error"=>$e,"human_error"=>"Could not unset two-factor authentication","username"=>$this->username);
      }
    mysqli_query($l,"COMMIT");
    return true;
  }


  public function sendTOTPText($number)
  {
    /***
     * Send a text message to the destination number with the TOTP code
     ***/
    # Get the current TOTP value for the user
    # Send the text through Twilio
    # Return the status and updated message
  }

  public static function generateQR($uri,$data_path = null,$identifier_path = null)
  {
    /*
     * Generate a QR code from a string
     *
     * @param string $uri
     * @param string $data_path The path to the write directory
     * @param string $identifier_path An optional subdirectory for paths; makes loops easier
     * @returns array with the main results in "svg" and "raw" keys, with a Google fallback in the "url" key
     */
    try
      {
        require_once(dirname(__FILE__)."/../qr/qrlib.php");
        $salt = Stronghash::createSalt();
        $persistent = !empty($data_path);
        if(!$persistent)
          {
            $tmp_dir = dirname(__FILE__).DIRECTORY_SEPARATOR.'temp'.DIRECTORY_SEPARATOR;
            if (!file_exists($tmp_dir))
              {
                if(!mkdir($tmp_dir))
                  {
                    # Could not write to temporary path
                    throw(new Exception("Could not write to '$tmp_dir'"));
                  }
              }
            $web_dir = 'temp/';
            require_once(dirname(__FILE__).'/../stronghash/php-stronghash.php');
            $filename = $tmp_dir . sha1($salt) . ".png";
          }
        else
          {
            # Persistent file
            $file = $sha1($salt . $uri);
            if(substr($data_path,-1) != "/") $data_path .= DIRECTORY_SEPARATOR;
            $full_path = empty($identifier_path) ? $data_path:$data_path . $identifier_path . DIRECTORY_SEPARATOR;
            if(!file_exists($full_path))
              {
                if(!mkdir($full_path))
                  {
                    # Could not write to the storage path
                    throw(new Exception("Could not write to '$full_path'"));
                  }
              }
            $filename = $full_path.$file.".png";
          }
        $svg = QRcode::svg($uri,false,QR_ECLEVEL_H,8,1);
        QRcode::png($uri,$filename,QR_ECLEVEL_H,8,1);
        $raw = base64_encode(file_get_contents($filename));
        $raw = "data:image/png;base64,".$raw;
        if(!$persistent) unlink($filename);
        # As a final option, get a URL fallback
        # https://developers.google.com/chart/infographics/docs/qr_codes?csw=1
        $url = "https://chart.googleapis.com/chart?cht=qr&chs=500x500&chld=H&chl=".$uri;
        return array("status"=>true,"uri"=>$uri,"svg"=>$svg,"raw"=>$raw,"url"=>$url);
      }
    catch(Exception $e)
      {
        return array("status"=>false,"human_error"=>"Unable to generate QR code","error"=>$e->getMessage(),"uri"=>$uri,"identifier"=>$identifier,"persistent"=>$persistent);
      }
  }





  /***
   * Primary functions
   ***/




  public function createUser($username,$pw_in,$name,$dname)
  {
    /***
     * Create a new user
     *
     * @param string $username A valid email address
     * @param string pw_in The input password. This function will hash it.
     * @param array $name An array of form array(firstName,lastName)
     * @param string $dname The display name of the user.
     * @return array
     ***/
    // Send email for validation
    $ou=$username;
    /***
     * Weaker, but use if you have problems with the sanitize() function.
     $l=$this->openDB();
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

    $result=$this->lookupItem($user,$this->usercol); #fase,true
    if($result!==false)
      {
        $data=mysqli_fetch_assoc($result);
        if($data[$this->usercol]==$username) return array(false,'Your email is already registered. Please try again. Did you forget your password?');
      }
    if(strlen($pw_in) < $this->getMinPasswordLength()) return array(false,'Your password is too short. Please try again.');
    // Complexity checks here, if not relegated to JS ...
    require_once(dirname(__FILE__).'/../stronghash/php-stronghash.php');
    $hash=new Stronghash;
    $creation=self::microtime_float();
    $pw1=$hash->hasher($pw_in);
    $pw_store=json_encode($pw1);
    $algo=$pw1['algo'];
    $salt=$pw1['salt'];
    if(!empty($pw1['rounds'])) $rounds="<rounds>".$pw1['rounds']."</rounds>";
    $data_init="<xml><algo>$algo</algo>$rounds</xml>";
    $ne=self::encryptThis($salt.$pw,implode(" ",$name)); // only encrypt if requested, then put in secdata
    $sdata_init="<xml><name>".$ne[0]."</name></xml>";
    $names="<xml><name>".sanitize(implode(" ",$name))."</name><fname>".sanitize($name[0])."</fname><lname>".$name[1]."</lname><dname>".sanitize($dname)."</dname></xml>";
    $hardlink=sha1($salt.$creation);
    $store = array();
    foreach($this->getCols() as $key=>$type)
      {
        $fields[]=$key;
        switch($key)
          {
          case $this->usercol:
            $store[]=$user;
            break;
          case $this->pwcol:
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
            $store[]= !$this->needsManualAuth();
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

    $test_res=$this->addItem($store,$fields);
    if($test_res)
      {
        // Get ID value
        $res = $this->lookupUser($user, $pw_in);
        $userdata=$res[1];
        $id=$userdata['id'];

        if($this->needsManualAuth()) requireUserAuth();

        if (is_numeric($id) && !empty($userdata))
          {
            $this->getUser($userdata);
            $cookies=$this->createCookieTokens();

            return array_merge(array(true,'Success!'),$userdata,$cookies);
          }
        else return array(false,'Failure: Unable to verify user creation',"add"=>$test_res,"userdata"=>$userdata);
      }
    else return array(false,'Failure: unknown database error. Your user was unable to be saved.');
  }

  public function lookupUser($username,$pw,$return=true,$totp_code=false)
  {
    // check it's a valid email! validation skipped.
    require_once(dirname(__FILE__).'/xml.php');
    $xml=new Xml;
    $result=$this->lookupItem($username,$this->usercol);
    if($result!==false)
      {
        try
          {
            $userdata=mysqli_fetch_assoc($result);
            if(is_numeric($userdata['id']))
              {
                // check password
                require_once(dirname(__FILE__).'/../stronghash/php-stronghash.php');
                $hash=new Stronghash;
                $data=json_decode($userdata[$this->pwcol],true);
                # Decrypt the password if totp_code is_numeric()
                if(is_numeric($totp_code))
                  {
                    $pw = $this->decryptWithStoredKey($pw);
                  }
                if($hash->verifyHash($pw,$data))
                  {
                    $this->getUser($userdata[$this->usercol]);

                    ## Does the user have 2-factor authentication?
                    if($this->has2FA())
                      {
                        $l = $this->openDB();
                        if(empty($totp_code))
                          {
                            # The user has 2FA turned on, prompt it
                            $key = Stronghash::createSalt();
                            $query = "UPDATE `".$this->getTable()."` SET `".$this->tmpcol."`='$key' WHERE `".$this->usercol."`='".$this->username."'";
                            $r = mysqli_query($l,$query);
                            if($r === false) throw(new Exception("Unable to encrypt password"));
                            $encrypted_pw = urlencode(self::encryptThis($key,$pw));

                            # Encrypt the keys to validate the user asynchronously
                            # Of course, this this was called asynchronously, the keys will be empty ...

                            $cookiekey=$this->domain."_secret";
                            $cookieauth=$this->domain."_auth";

                            $encrypted_secret = self::encryptThis($key,$_COOKIE[$cookiekey]);
                            $encrypted_hash = self::encryptThis($key,$_COOKIE[$cookieauth]);
                            return array(false,"totp"=>true,"error"=>false,"human_error"=>"Please enter the code generated by the authenticator application on your device.","encrypted_password"=>$encrypted_pw,"encrypted_secret"=>$encrypted_secret,"encrypted_hash"=>$encrypted_hash);
                          }
                        if($this->verifyTOTP($totp_code) !== true)
                          {
                            # Bad TOTP code
                            return array(false,"totp"=>true,"error"=>"Invalid TOTP code","human_error"=>"Bad verification code. Please try again.");
                          }
                        # Remove the encryption key
                        $query = "UPDATE `".$this->getTable()."` SET `".$this->tmpcol."`='' WHERE `".$this->usercol."`='".$this->username."'";
                        mysqli_query($l,$query);
                        if(!$return)
                          {
                            # Return decrypted userdata, if applicable
                            $decname=self::decryptThis($salt.$pw,$userdata['name']);
                            if(empty($decname))$decname=$userdata['name'];
                            return array(true,$decname);
                          }
                        else
                          {
                            $decname=self::decryptThis($salt.$pw,$userdata['name']);
                            if(empty($decname))$decname=$userdata['name'];
                            $returning=array(true,$userdata);
                            return $returning;
                          }
                      }

                    if($userdata['flag'] && !$userdata['disabled'])
                      {
                        # This user is OK and not disabled, nor pending validation
                        if(!$return)
                          {
                            # Return decrypted userdata, if applicable
                            $decname=self::decryptThis($salt.$pw,$userdata['name']);
                            if(empty($decname))$decname=$userdata['name'];
                            return array(true,$decname);
                          }
                        else
                          {
                            $decname=self::decryptThis($salt.$pw,$userdata['name']);
                            if(empty($decname))$decname=$userdata['name'];
                            $returning=array(true,$userdata);
                            return $returning;
                          }
                      }
                    else
                      {
                        if(!$userdata['flag'])return array(false,"message"=>'Your login information is correct, but your account is still being validated, or has been disabled. Please try again later.');
                        if($userdata['disabled'])
                          {
                            // do a time check
                            if($userdata['dtime']+3600>self::microtime_float())
                              {
                                $rem=intval($userdata['dtime'])-intval(self::microtime_float())+3600;
                                $min=$rem%60;
                                $sec=$rem-60*$min;
                                return array(false,'message'=>'Your account has been disabled for too many failed login attempts. Please try again in '.$min.' minutes and '.$sec.' seconds.');
                              }
                            else
                              {
                                // Clear login disabled flag
                                $query1="UPDATE `".$this->getTable()."` SET disabled=false WHERE id=".$userdata['id'];
                                $l=$this->openDB();
                                $result=mysqli_query($l,$query1);
                              }
                          }
                        // All checks passed.
                        if(!$return)
                          {
                            $decname=self::decryptThis($salt.$pw,$userdata['name']);
                            if(empty($decname))$decname=$userdata['name'];
                            return array(true,$decname);
                          }
                        else
                          {
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
            else return array(false,'message'=>'Sorry, your username or password is incorrect.','error'=>'Bad username','desc'=>"No numeric id");
          }
        catch(Exception $e)
          {
            return array(false,"message"=>"System error. Please try again. If the problem persists, please report it.","error"=>$e->getMessage());
          }
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
     * Can be spoofed with inspected code at the same IP.
     * Similarly, gets around 2FA at the same IP.
     *
     * @param string $userid User email
     * @param string $hash Provide the final computed string to work with
     * @param string $secret Provide the cookie secret to work with
     * @param bool $detail Provide detailed returns
     * @return bool|array bool if $detail is false, array if $detail is true
     ***/
    if(strpos($userid,"@")===false && !empty($userid)) $userid = array("dblink"=>$userid);
    $userdata = $this->getUser($userid);
    if(is_array($userdata))
      {
        $pw_characters=json_decode($userdata[$this->pwcol],true);
        $salt=$pw_characters['salt'];

        if(empty($hash) || empty($secret))
          {

            $cookiekey=$this->domain."_secret";
            $cookieauth=$this->domain."_auth";

            $secret=$_COOKIE[$cookiekey];
            $hash=$_COOKIE[$cookieauth];
            $from_cookie=true;
            if(empty($hash) || empty($secret))
              {
                if($detail) return array("state"=>false,"status"=>false,"error"=>"Empty verification tokens","uid"=>$userid,"salt"=>$salt,"calc_conf"=>$conf,"basis_conf"=>$hash,"have_secret"=>self::strbool(empty($secret)),"from_cookie"=>self::strbool($from_cookie));
                return false;
              }
          }
        else $from_cookie=false;

        $current_ip = $_SERVER['REMOTE_ADDR'];

        # Are they logging in from the same IP?
        if($userdata[$this->ipcol] != $current_ip)
          {
            if($detail) return array("state"=>false,"status"=>false,"error"=>"Different IP address on login","uid"=>$userid,"salt"=>$salt,"calc_conf"=>$conf,"basis_conf"=>$hash,"have_secret"=>self::strbool(empty($secret)),"from_cookie"=>self::strbool($from_cookie),"stored_ip"=>$userdata[$this->ipcol],"current_ip"=>$current_ip);
            return false;
          }

        $value_create=array($secret,$salt,$userdata[$this->cookiecol],$userdata[$this->ipcol],$this->getSiteKey());

        $conf=sha1(implode('',$value_create));
        $state= $conf==$hash ? true:false;
        if($state) $this->getUser($userdata[$this->usercol]);
        if($detail) return array('state'=>self::strbool($state),"status"=>true,"uid"=>$userid,"salt"=>$salt,"calc_conf"=>$conf,"basis_conf"=>$hash,"from_cookie"=>self::strbool($from_cookie),'got_user_pass_info'=>is_array($pw_characters),'got_userdata'=>is_array($userdata),'source'=>$value_create);
        return $state;
      }
    else
      {
        // empty result
        if($detail) return array("state"=>false,"status"=>false,"error"=>"Invalid userid lookup","uid"=>$userid,"col"=>$col,"basis_conf"=>$hash,"have_cookie_secret"=>self::strbool(empty($secret)));
        return false;
      }
    if($detail)
      {
        $detail=array("uid"=>$userid,'col'=>$col,"basis_conf"=>$hash,"have_secret"=>self::strbool(empty($secret)));
        if(is_array($result)) $detail['error']=$result['error'];
        return $detail;
      }
    return false;
  }

  public function createCookieTokens($username = null,$password_or_is_data=true, $remote = null)
  {
    try
      {
        if(empty($username))
          {
            $userdata = $this->getUser();
            $username = $this->username;
          }
        else if($password_or_is_data===true)
          {
            $userdata=$username;
            $username=$this->username;
          }
        else
          {
            $r = $this->lookupUser($username,$password_or_is_data);
            if($r[0]===false) return array(false,'status'=>false,'error'=>"<p>Bad user credentials</p>","username"=>$username);
            $userdata=$r[1];
          }
        $id=$userdata['id'];

        # Nom, cookies!
        $expire_days=7;
        $expire=time()+3600*24*$expire_days;
        // Create a one-time key, store serverside
        require_once(dirname(__FILE__).'/../stronghash/php-stronghash.php');
        $otsalt=Stronghash::createSalt();
        $cookie_secret=Stronghash::createSalt();
        $pw_characters=json_decode($userdata[$this->pwcol],true);
        $salt=$pw_characters['salt'];
        $current_ip = empty($current_ip) ? $_SERVER['REMOTE_ADDR']:$remote;

        //store it
        $query="UPDATE `".$this->getTable()."` SET `".$this->cookiecol."`='$otsalt', `".$this->ipcol."`='$current_ip' WHERE id='$id'";
        $l=$this->openDB();
        mysqli_query($l,'BEGIN');
        $result=mysqli_query($l,$query);
        if($result===false)
          {
            $r=mysqli_query($l,'ROLLBACK');
            return array(false,'status'=>false,'error'=>"<p>".mysqli_error($l)."<br/><br/>ERROR: Could not update login state.</p>");
          }
        else $r=mysqli_query($l,'COMMIT');

        $value_create=array($cookie_secret,$salt,$otsalt,$current_ip,$this->getSiteKey());

        // authenticated since last login. Nontransposable outside network.

        $value=sha1(implode('',$value_create));

        $cookieuser=$this->domain."_user";
        $cookieperson=$this->domain."_name";
        $cookieauth=$this->domain."_auth";
        $cookiekey=$this->domain."_secret";
        $cookiepic=$this->domain."_pic";
        $cookielink=$this->domain."_link";

        $xml=new Xml;
        $user_greet=$xml->getTagContents($userdata['name'],"<fname>"); // for now
        $dblink=$userdata['dblink'];

        setcookie($cookieauth,$value,$expire);
        setcookie($cookiekey,$cookie_secret,$expire);
        setcookie($cookieuser,$username,$expire);
        setcookie($cookieperson,$user_greet,$expire);
        $path=$this->getUserPicture($userdata['id']);
        setcookie($cookiepic,$path,$expire);
        setcookie($cookielink,$dblink,$expire);

        $js_expires=",{expires:$expire_days,path:'/'});\n";
        $jquerycookie="$.cookie('$cookieauth','$value'".$js_expires;
        $jquerycookie.="$.cookie('$cookiekey','$cookie_secret'".$js_expires;
        $jquerycookie.="$.cookie('$cookieuser','$username'".$js_expires;
        $jquerycookie.="$.cookie('$cookieperson','$user_greet'".$js_expires;
        $jquerycookie.="$.cookie('$cookiepic','$path'".$js_expires;
        $jquerycookie.="$.cookie('$cookielink','$dblink'".$js_expires;

        $raw_data = array(
          $cookieuser=>$username,
          $cookieauth=>$value,
          $cookiekey=>$cookie_secret,
          $cookiepic=>$path,
          $cookieperson=>$user_greet,
          $cookielink=>$dblink
        );

        return array(
          'status'=>true,
          'user'=>"{ '$cookieuser':'$username'}",
          'auth'=>"{'$cookieauth':'$value'}",
          'secret'=>"{'$cookiekey':'$cookie_secret'}",
          'pic'=>"{'$cookiepic':'$path'}",
          'name'=>"{'$cookieperson':'$user_greet'}",
          'link'=>"{'$cookielink':'$dblink'}",
          'js'=>$jquerycookie,
        'source'=>$value_create,
        'ip_given'=>$remote,
          'raw_auth'=>$value,
          'raw_cookie'=>$raw_data,
          'basis'=>$value_create,
          'expires'=>"{expires:$expire_days,path:'/'}"
        );
      }
    catch(Exception $e)
      {
        return array('status'=>false,'error'=>"Unexpected exception: ".$e->getMessage());
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
            $validated=$a[0];
            if($validated) $this->getUser(array("username"=>$validation_data['username']));
            $method='Password';
          }
        else return array('status'=>false,"error"=>"Bad validation data");
      }
    else
      {
        $validated=$this->validateUser();
        $method='Cookie';
      }
    if($validated)
      {
        $userdata = $this->getUser();
        $where_col = "dblink";
        $user = $userdata[$where_col];
        if(empty($user)) return array("status"=>false,"error"=>"Problem assigning user");
        // write it to the db
        // replace or append based on flag
        require_once(dirname(__FILE__).'/../CONFIG.php');
        $real_col=sanitize($col);
        if(!$replace)
          {
            // pull the existing data ...
            $l=$this->openDB();
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
        $l=$this->openDB();
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

  public function confirmUser()
  {
    /***
     * Confirm the user and toggle the flog
     ***/
  }

  public function requireUserAuth()
  {
    /***
     * Set up the flags and verification tokens to disable a user until the authorization flag is passed
     * The user calling this function themselves needs an admin flag and must be logged in.
     ***/
    // $store=array($user,$pw_store,'',$creation,'',$names,true,false,false,false,0,'','','',$data_init,$sdata_init,'','',$hardlink,'','',''); // set flag to FALSE if authentication wanted.
    /* Uncomment if authentication has been requested */
    /*
    // Create hash - user + encrypted name + salt
    $ne=$ne[0];
    $hash=sha1($user.$ne.$salt);
    $validlink=$baseurl."/login.php?confirm=$hash&amp;token=$creation&amp;lookup=$id";
    $affix="&amp;email=".htmlentities($email_in);
    $validlink.=$affix;
    // email
    $email='blackhole@'.$this->domain;
    $to='admin@'.$this->domain;
    $headers  = 'MIME-Version: 1.0' . "\r\n";
    $headers .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";
    $headers .= "From: $name (via $this->domain) <$email>";
    $subject="[User Signup] New User - $name";
    $body="<p>$name is requesting access to files for $title. You can click the following link to enable access to the files, and click the link later to disable access.</p>\n<p><a href='$validlink'>$validlink</a><p>\n<p>Thank you. For debugging purposes, the user was hashed with $algo.</p>";
    if(mail($to,$subject,$body,$headers))
    {
    //mail($this->supportEmail,$subject,$body,$headers); // debugging confirmation
    return array(true,"Success! You will receive confirmation when your account has been activated.");
    }
    */
  }

  public function verifyUserAuth()
  {
    /***
     * If a user needs to be authorized before being allowed access,
     * check the authorization token here and update the flag
     ***/
  }

  public static function encryptThis($key,$string)
  {
    /*
     * @param string $key
     * @param string $string
     * @return string An encrypted, base64-encoded result
     */

    $encrypted = base64_encode(mcrypt_encrypt(MCRYPT_RIJNDAEL_256, md5($key), $string, MCRYPT_MODE_CBC, md5(md5($key))));
    return $encrypted;
  }
  public static function decryptThis($key,$encrypted)
  {
    /*
     * @param string $key
     * @param string $encrypted A base 64 encoded string
     * @return string The decrypted string
     */

    $decrypted = rtrim(mcrypt_decrypt(MCRYPT_RIJNDAEL_256, md5($key), base64_decode($encrypted), MCRYPT_MODE_CBC, md5(md5($key))), "\0");
    return $decrypted;
  }
  public function decryptWithStoredKey($encrypted)
  {
    /***
     * @param string $encrypted A base 64 encoded string
     * @return string|bool decrypted string or false
     ***/
    $this->getUser();
    if(!empty($this->usercol))
      {
        $l = $this->openDB();
        $query = "SELECT `".$this->tmpcol."` FROM `".$this->getTable()."` WHERE `".$this->usercol."`='".$this->username."'";
        $r = mysqli_query($l,$query);
        if($r === false)
          {
            throw(new Exception("Could not get decryption key -- ".mysqli_error($l)));
          }
        $row = mysqli_fetch_row($r);
        $key = $row[0];
        $string = self::decryptThis($key,$encrypted);
        return $string;
      }
    return false;
  }
}
?>