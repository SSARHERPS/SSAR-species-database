<?php

require_once(dirname(__FILE__).'/handlers/login_functions.php');
require_once(dirname(__FILE__).'/handlers/functions.inc');
require_once(dirname(__FILE__).'/handlers/db_hook.inc');

function returnAjax($data)
{
  if(!is_array($data)) $data=array($data);
  header('Cache-Control: no-cache, must-revalidate');
  header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
  header('Content-type: application/json');
  print @json_encode($data,JSON_FORCE_OBJECT);
  exit();
}

parse_str($_SERVER['QUERY_STRING'],$_GET);
$do=isset($_REQUEST['action']) ? strtolower($_REQUEST['action']):null;

switch($do)
  {
  case 'get_login_status':
    returnAjax(getLoginState($_REQUEST));
    break;
  case 'write':
    returnAjax(saveToUser($_REQUEST));
    break;
  case 'get':
    returnAjax(getFromUser($_REQUEST));
    break;
  case "maketotp":
    returnAjax(generateTOTPForm($_REQUEST));
    break;
  case "verifytotp":
    returnAjax(verifyTOTP($_REQUEST));
    break;
  case "savetotp":
    returnAjax(saveTOTP($_REQUEST));
    break;
  case "sendtotptext":
    returnAjax(sendTOTPText($_REQUEST));
    break;
  case "totpstatus":
    returnAjax(hasTOTP($_REQUEST));
    break;
  case "cansms":
    returnAjax(canSMS($_REQUEST));
    break;
  case "verifyphone":
    returnAjax(verifyPhone($_REQUEST));
  default:
    returnAjax(getLoginState($_REQUEST),true);
  }

function getLoginState($get,$default=false)
{
  $conf=$get['hash'];
  $s=$get['secret'];
  $id=$get['dblink'];
  $u=new UserFunctions();
  return array("status"=>$u->validateUser($id,$conf,$s),'defaulted'=>$default);
}

function hasTOTP($get)
{
  $user = $get["user"];
  $u = new UserFunctions($user);
  try
    {
      return $u->has2FA();
    }
  catch(Exception $e)
    {
      return false;
    }
}

function canSMS($get)
{
  $user = $get["user"];
  $u = new UserFunctions($user);
  try
    {
      # This should be non-strict
      return $u->canSMS(false);
    }
  catch(Exception $e)
    {
      return false;
    }
}

function generateTOTPForm($get)
{
  $user = $get['user'];
  $password = $get['password'];
  $u = new UserFunctions($user);
  $r = $u->lookupUser($user,$password);
  if($r[0] === false)
    {
      $r["status"] = false;
      return $r;
    }
  # User is valid

  # Get a provider
  $baseurl = 'http';
  if ($_SERVER["HTTPS"] == "on") {$baseurl .= "s";}
  $baseurl .= "://www.";
  $baseurl.=$_SERVER['HTTP_HOST'];
  $base=array_slice(explode(".",$baseurl),-2);
  $domain=$base[0];

  $r = $u->makeTOTP($domain);

  # Whether or not it fails, return $r

  return $r;
}

function saveTOTP($get)
{
  $user = $get['user'];
  $secret = $get['secret'];
  $hash = $get['hash'];
  $code = $get['code'];
  $u = new UserFunctions($user);
  $r = $u->validateUser($user,$hash,$secret);
  if ($r === false)
    {
      return array("status"=>false,"error"=>"Couldn't validate cookie information","human_error"=>"Application error");
    }

  return $u->saveTOTP($code);
}


function verifyTOTP($get)
{
  $code = $get['code'];
  $user = $get['user'];
  $password = urldecode($get['password']);
  $password = str_replace(' ','+',$password);
  $secret = $get['secret'];
  $hash = $get['hash'];
  $remote = $get['remote'];
  $is_encrypted = boolstr($get['encrypted']);
  # If it's a good code, pass the cookies back
  $u = new UserFunctions($user);

  /* print_r("bob"."\n\n");
  $e=$u->encryptThis("sally","bob");
  print_r($e."\n\n");
  print_r($u->decryptThis("sally",$e)."\n\n");*/

  $r = $u->lookupUser($user,$password,false,$code);

  if($r[0] === false)
    {
      $r["status"] = false;
      $r["human_error"] = $r["message"];
      return $r;
    }
  ## The user and code is valid!
  $return = array("status"=>true);
  $userdata = $r[1];
  $cookie_result = $u->createCookieTokens(null,true,$remote);
  $return["cookies"] = $cookie_result;
  $return["string"] = json_encode($cookie_result["raw_cookie"]);
  return $return;
}

function sendTOTPText($get)
{
  $user = $get['user'];
  # We don't need to verify the user here
  $u = new UserFunctions($user);
  # Ensure the user has SMS-ability and 2FA
  try
    {
      # Return status
      if(!$u->has2FA())
        {
          return array("status"=>false,"human_error"=>"Two-Factor authentication is not enabled for this account","error"=>"Two-Factor authentication is not enabled for this account","username"=>$user);
        }
      if(!$u->canSMS())
        {
          return array("status"=>false,"human_error"=>"Your phone setup isn't complete","error"=>"User failed SMS check","username"=>$user);
        }
      $result = $u->sendTOTPText();
      return array("status"=>$result,"message"=>"Message sent");
    }
  catch (Exception $e)
    {
      return array("status"=>false,"human_error"=>"There was a problem sending your text.","error"=>$e->getMessage());
    }
}

function verifyPhone($get)
{
  /***
   * Verify a phone number.
   * An empty or bad verification code generates a new one to be saved in the temp column
   ***/
  $u = new UserFunctions($get['username']);
  try
    {
      return $u->verifyPhone($get['auth']);
    }
  catch(Exception $e)
    {
      return array("status"=>false,"error"=>$e->getMessage(),"human_error"=>"Failed to send verification text.");
    }
}


function saveToUser($get)
{
  /***
   * These are OK to pass with plaintext, they'll change with a different device anyway (non-persistent).
   * Worst-case scenario it only exposes public function calls. Sensitive things will need explicit revalidation.
   ***/
  $conf=$get['hash'];
  $s=$get['secret'];
  $id=$get['dblink'];
  $replace = boolstr($get['replace']);
  /***
   * These fields can only be written to from directly inside of a script, rather than an AJAX call.
   ***/
  $protected_fields = array(
    'username',
    'password',
    'admin_flag',
    'su_flag',
    'private_key',
    'public_key',
    'creation',
    'dblink',
    'secret',
    'emergency_code'
  );
  if(!empty($conf) && !empty($s) && !empty($id) && !empty($get['data']) && !empty($get['col']))
    {
      $u=new UserFunctions();
      if($u->validateUser($id,$conf,$s))
        {
          // Yes, writeToUser looks up the validation again, but it is a more robust feedback like this
          // Could pass in $get for validation data, but let's be more limited
          $val=array("dblink"=>$id,"hash"=>$conf,"secret"=>$s);
          $data=decode64($get['data']);
          $col=decode64($get['col']);
          if(empty($data) || empty($col)) return array('status'=>false,'error'=>'Invalid data format (required valid base64 data)');
          // User safety
          if(in_array($col,$protected_fields,true)) return array('status'=>false,'error'=>'Cannot write to $col : protected field');
          return $u->writeToUser($data,$col,$val);
        }
      else return array('status'=>false,'error'=>'Invalid user');
    }
  return array('status'=>false,'error'=>"One or more required fields were left blank");
}


function getFromUser($get) {
  $conf=$get['hash'];
  $s=$get['secret'];
  $id=$get['dblink'];
  if(!empty($conf) && !empty($s) && !empty($id) && !empty($get['col']))
    {
      $u=new UserFunctions();
      if($u->validateUser($id,$conf,$s))
        {
          require_once(dirname(__FILE__).'/CONFIG.php');
          global $default_user_database,$default_user_table;
          $col=decode64($get['col']);
          $l=openDB($default_user_database);
          $query="SELECT $col FROM `$default_user_table` WHERE dblink='$id'";
          $r=mysqli_query($l,$query);
          $row=mysqli_fetch_row($r);
          return array('status'=>true,'data'=>deescape($row[0]));
        }
      else return array('status'=>false,'error'=>'Invalid user');
    }
  return array('status'=>false,'error'=>"One or more required fields were left blank");
}

?>