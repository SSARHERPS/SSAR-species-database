<?php

include_once('handlers/crypt_functions.php');
include_once('handlers/xml.php');

function microtime_float()
{
  list($usec, $sec) = explode(" ", microtime());
  return ((float)$usec + (float)$sec);
}

function curPageURL() {
  $pageURL = 'http';
  if ($_SERVER["HTTPS"] == "on") {$pageURL .= "s";}
  $pageURL .= "://";
  if ($_SERVER["SERVER_PORT"] != "80") {
    $pageURL .= $_SERVER["SERVER_NAME"].":".$_SERVER["SERVER_PORT"].$_SERVER["REQUEST_URI"];
  } else {
    $pageURL .= $_SERVER["SERVER_NAME"].$_SERVER["REQUEST_URI"];
  }
  require_once('modular/db_hook.inc');
  return cleanInput($pageURL);
}

function appendQuery($query) {
  $url = curPageURL();
  $url=str_replace("&","&amp;",$url);
  if(strpos($url,"?")!==FALSE) $url .= "&amp;" . $query;
  else $url .= "?" . $query;
  return $url;
}

function dirListPHP ($directory,$filter=null) 
{
  $results = array();
  $handler = @opendir($directory);
  if($handler===false) return false;
  while ($file = readdir($handler)) 
    {
      if ($file != '.' && $file != '..' )  
        {
          if($filter!=null)
            {
              if(strpos(strtolower($file),strtolower($filter))!==false) $results[]=$file;
            }
          else $results[] = $file;
        }
    }
  closedir($handler);
  return $results;
}


function lookupUser($username,$pw,$return=false)
{
  // check it's a valid email! validation skipped.
  $xml=new Xml;
  $result=lookupItem($username,'username',null,null,false);
  $userdata=@mysqli_fetch_assoc($result);
  if($result!==false && is_numeric($userdata['id']))
    {
      /*    echo "<pre>Lookup User Function for '$username' ..\n";
            print_r($userdata);
            echo "\nResult data:\n";
            print_r($result);
            echo "</pre>";*/
      // check password
      $salt=$userdata['salt'];
      $creation=$userdata['creation'];
      $input=$salt . $pw . $creation;
      $algo=$xml->getTagContents($userdata['data'],"<algo>");
      /*
        if(strpos($algo,"_pbkdf2")!==false || strpos($algo,"_crypt")!==false ) $pw1=sha($input,$salt);
        else $pw1=sha($input);
      */
      // temp for old accounts
      if($algo=='sha512') $saltin="";
      else $saltin=$salt;
      // end temp for old accounts
      $rounds=$xml->getTagContents($userdata['data'],"<rounds>");
      $pw1=sha($input,$saltin,$algo,false,$rounds);
      if($algo!=$pw1['algo']) 
        {
          // do it manually if algorithms don't match
          $hash=@hash($algo,$input);
          if($hash!==false)
            {
              $pw1=array('hash'=>$hash,'algo'=>$algo);
            }
          else return array(false,"This server does not support hashing algorithm $algo (This server attempted to use ".$pw1['algo'].")");
        }
      @require_once('modular/pbkdf2.php');
      if(slow_equals($pw1['hash'],$userdata['pass']))
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
                  $userdata['dec_name']=$decname;
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
                  if($userdata['dtime']+3600>microtime_float()) 
                    {
                      $rem=intval($userdata['dtime'])-intval(microtime_float())+3600;
                      $min=$rem%60;
                      $sec=$rem-60*$min;
                      return array(false,'Your account has been disabled for too many failed login attempts. Please try again in '.$min.' minutes and '.$sec.' seconds.');
                    }
                  else 
                    {
                      // Clear login disabled flag
                      $query1="UPDATE validusers SET disabled=false WHERE id=".$userdata['id'];
                      $res1=openDB();
                      $result=execAndCloseDB($query1);
                    }
                }
              // All checks passed.
              if(!$return) 
                {
                  //echo "<p>Return was false.</p>";
                  $decname=decryptThis($userdata['name'],$pw,$salt);
                  if(empty($decname))$decname=$userdata['name'];
                  return array(true,$decname);
                }
              else 
                {
                  $decname=decryptThis($userdata['name'],$pw,$salt);
                  if(empty($decname))$decname=$userdata['name'];
                  $userdata['dec_name']=$decname;
                  $returning=array(true,$userdata);
                  return $returning;
                }
            }
        }
      else
        {
          return array(false,'Bad password');
        }
      // end good username loop 
    }
  else return array(false,'Unrecognized username');
}


function displayDebug($string)
{
  // alias
  return debugDisplay($string);
}
function debugDisplay($string)
{
  $string=str_replace("&","&amp;",$string);
  $string=str_replace("<","&lt;",$string);
  $string=str_replace(">","&gt;",$string);
  return $string;
}
function datestamp()
{
  return date("Ymd-HisO");
}






function array_find($needle, $haystack, $search_keys = false, $strict = false) 
{
  if(!is_array($haystack)) return false;
  foreach($haystack as $key=>$value) 
    {
      $what = ($search_keys) ? $key : $value;
      if($strict)
        {
          if($value==$needle) return $key;
        }
      else if(@strpos($what, $needle)!==false) return $key;
    }
  return false;
}

function getUserPicture($id,$path)
{
  if(substr($path,-1)!="/") $path=$path."/";
  $valid_ext=array('jpg','jpeg','png','bmp','gif');
  foreach($valid_ext as $ext)
    {
      $file=$id.".".$ext;
      if(file_exists($path.$file)) return $path.$file;
    }
  return $path."default.jpg";
}


function do_post_request($url, $data, $optional_headers = null)
{
  $params = array('http' => array(
    'method' => 'POST',
    'content' => $data
  ));
  if ($optional_headers !== null) {
    $params['http']['header'] = $optional_headers;
  }
  $ctx = stream_context_create($params);
  $fp = @fopen($url, 'rb', false, $ctx);
  if (!$fp) {
    throw new Exception("Problem with $url, $php_errormsg");
  }
  $response = @stream_get_contents($fp);
  if ($response === false) {
    throw new Exception("Problem reading data from $url, $php_errormsg");
  }
  return $response;
}

function emailThis($to,$from=null,$name,$subject,$message,$default_subject=true,$default_lede=true,$cc=false)
{
  global $baseurl;
  if(empty($baseurl)) $baseurl=$_SERVER['HOST_NAME'];
  $base=array_slice(explode(".",$baseurl),-2);
  $urltail=implode(".",$base);
  if(empty($from)) $from="blackhole@$urltail";
  $body="<html>\n<head>\n<meta http-equiv='Content-Type' content='text/html; charset=utf-8' />\n<title>$subject</title>\n</head><body>";
  if($default_lede) $body.="<p>$name sent you an email via $urltail.</p>";
  $body.="<pre>$message</pre>";
  $body.="</body></html>";
  $headers=array();
  $headers[]= 'MIME-Version: 1.0';
  $headers[]= 'Content-type: text/html; charset="UTF-8"';
  $headers[]= "From: blackhole <blackhole@$urltail>";
  $headers[]= "Reply-To: $name <$from>";
  $headers[]= "Return-Path:<blackhole@$urltail>";
  $headers[]= "X-Mailer: PHP/".phpversion();
  if($default_subject) $subject="[$urltail Contact Form] " . $subject;
  $status=mail($to,$subject,$body,implode("\r\n", $headers));
  // return array of ([sent status],[cc true],[cc status])
  if(!$cc) return array($status,false,false);
  else
    {
      $headers=array();
      $headers[]= 'MIME-Version: 1.0';
      $headers[]= 'Content-type: text/html; charset="UTF-8"';
      $headers[]= "From: <$from>";
      $headers[]= "Reply-To: blackhole <blackhole@$urltail>";
      $headers[]= "Return-Path:<blackhole@$urltail>";
      $headers[]= "X-Mailer: PHP/".phpversion();      
      $body="<html>\n<head>\n<meta http-equiv='Content-Type' content='text/html; charset=utf-8' />\n<title>$subject</title>\n</head><body>";
      $body.="<p>A copy of your message to <a href='$baseurl'>$baseurl</a> follows.</p><hr/>";
      $body.="<pre>$message</pre>";
      $body.="</body></html>";
      $ccstat=mail($from,$subject,$body,implode("\r\n", $headers));
      return array($status,true,$ccstat);
    }
}

function strbool($bool)
{
  // returns the string of a boolean as 'true' or 'false'.
  if(is_string($bool)) $bool=boolstr($bool); // if a string is passed, convert it to a bool
  if(is_bool($bool)) return $bool ? 'true' : 'false';
  else return false;
}
function boolstr($string)
{
  // returns the boolean of a string 'true' or 'false'
  if(is_string($string)) return strtolower($string)==='true' ? true:false;
  else if(is_bool($string)) return $string;
  else if(preg_match("/[0-1]/",$string)) return $string==1 ? true:false;
  else return false;
}

function readJSON($data,$attribute=null)
{
  $array=json_decode($data,true);
  if(!empty($attribute))
    {
      // return the attribute
      return getNestedKey($array,$attribute);
    }
  if(sizeof($array)>0)  return $array;
  else return false;
}

function getNestedKey($array,$key)
{
  if(@array_key_exists($key,$array))
    {
      return $array[$key];
    }
  else if(is_array($array))
    {
      foreach($array as $element)
        {
          if(is_array($element))
            {
              $result=getNestedKey($element,$key);
              if($result!==false) return $result;
            }
        }
    }
  return false;
}

function validateUser($userid,$hash,$strong=false,$detail=false)
{
  // return true or false based on user validation. 
  // Prevent ajax or post call manually -- has to be called from a webpage
  // maybe this should check the cookies?
  /*
    Notes: This does not prevent inspected HTML data on a hacked account. This ensures that either:
    1) The person gained access to the account
    2) The person hacked both the database and the webserver
  */
  $result=lookupItem($userid,'hardlink',null,null,false);
  if($result!==false)
    {
      global $authsalt;
      $userdata=mysqli_fetch_assoc($result);
      $salt=$userdata['salt'];
      $data=$authsalt.$userid.$salt;
      $conf=hash('sha512',$data);
      // possibly compare to the cookie
      $retval = $strong!==false ? true && doesThis($strong,$userid):true;
      if($conf==$hash) return $retval;
    }
  if($detail) return array("uid"=>$userid,"auth"=>$authsalt,"salt"=>$salt,"conf"=>$conf,"given_conf"=>$hash);
  return false;
}

function encode64($data) { return base64_encode($data); }
function decode64($data) 
{
  if(base64_encode(base64_decode($data,true))==$data) return urldecode(base64_decode($data));
  return false;
}

function smart_decode64($data,$clean_this=true) {
  /*
   * Take in a base 64 object, decode it. Pass back an array 
   * if it's a JSON, and sanitize the elements in any case.
   */
  if(is_null($data)) return null; // in case emptyness of data is meaningful
  $r=decode64($data);
  if($r===false) return false;
  $jd=json_decode($r,true);
  $working= is_null($jd) ? $r:$jd;
  if($clean_this)
    {
      try
        {
          // clean
          if(is_array($working))
            {
              foreach($working as $k=>$v)
                {
                  $ck=sanitize($k);
                  $cv=sanitize($v);
                  $prepped_data[$ck]=$cv;
                }
            }
          else $prepped_data=sanitize($working);
        }
      catch (Exception $e)
        {
          // Something broke, probably an invalid data format.
          return false;
        }
    }
  else $prepped_data=$working;
  return $prepped_data;
}

function createCookieTokens($userdata,$title) {
  require_once('base.inc');
  $id=$userdata['id'];
  //Set a cookie
  $cookiename=str_replace(" ","",$title);
  $domain=".".substr($baseurl,strpos($baseurl,'.'));
  $expire=time()+3600*24*7; // one week
  // Create a one-time key, store serverside
  $otsalt=genUnique();
  //store it
  $query="UPDATE validusers SET cookie_key='$otsalt' WHERE id='$id'";
  $l=openDB();
  $result=mysqli_query($l,$query);
  if(!$result) return array(false,'status'=>false,'error'=>"<p>".myslqi_error($l)."<br/><br/>ERROR: Could not log in.</p>");
  $value_create=$userdata['salt'].$otsalt.$_SERVER['REMOTE_ADDR']; 
  // authenticated since last login. Nontransposable outside network.
  $value=sha($value_create,null,'sha512',false);
  $cookieuser=$cookiename."_user";
  $cookieauth=$cookiename."_auth";
  $cookiealg=$cookiename."_alg";
  $cookiepic=$cookiename."_pic";
  /*echo "<pre>";
    echo "Cookie Info: $cookieuser $cookiealg $cookiepic \n $cookieauth :";
    print_r($value);
    echo "/<pre>";*/
  setcookie($cookieauth,$value['hash'],$expire);
  setcookie($cookiealg,$value['algo'],$expire);//,null,$domain);
  setcookie($cookieuser,$userdata['username'],$expire);//,null,$domain);
  $path=getUserPicture($userdata['id'],'userdata/profilepics');
  setcookie($cookiepic,$path,$expire);//,null,$domain);
  return array(true,'status'=>true,'user'=>"{ $cookieuser :".$userdata['username']."}",'auth'=>"{ $cookieauth :".$value['hash']."}",'algo'=>"{ $cookiealg :".$value['algo']."}");
}
?>