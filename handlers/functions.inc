<?php

// Browser detection for SVGs is in commonheader.  The code is
// if(browser_detection('browser')=='ie') echo "<script src='modular/src/svg.js' data-path='modular/src' type='text/javascript'></script>";

/*
 * The hashing functions here should be deprecated and replaced with php-stronghash
 * https://github.com/tigerhawkvok/php-stronghash
 */

function dispSVG($resource,$alt=NULL,$width=NULL,$height=NULL,$id=NULL,$class=NULL,$return=false)
{
  //object width
  $ostyle=" ";
  if(is_numeric($width)) $ostyle .= "width='$width" . "px'";
  if(is_numeric($height)) $ostyle .= " height='$height" . "px'";

  //CSS width
  if(is_numeric($width) || is_numeric($height)) $cstyle=" style='";
  else $cstyle="";
  if(is_numeric($width)) $cstyle .="width:$width" . "px;";
  if(is_numeric($height)) $cstyle .="height:$height" . "px;";
  if($cstyle!="") $cstyle .="' ";

  //identifiers
  if($id!=NULL) $ido="id='$id'";
  if($class!=NULL) $classo="class='$class'";

  // Check directory for gzip-svg.php
  $subdir = dirname($resource);
  if(file_exists($subdir . "/gzip-svg.php"))
    {
      $resource_old=$resource;
      $resource = $subdir . "/gzip-svg.php?name=" . basename($resource);
    }
  else $resource_old=$resource;

  // Detect browsers.  IE falls back to Google's code, and FireFox falls back to <object> implementation.
  if(browser_detection('browser')=='moz')
    {
      $out="<object data='$resource' type='image/svg+xml' $ostyle $ido $classo>\n$alt\n</object>";
      if(!$return) echo $out;
      else return $out;
    }
  else if(browser_detection('browser')=='ie')
    {
      if(browser_detection('number')<9)
        {
          // Check for a png
          $pngfile = substr($resource_old, 0, -4) . ".png";
          if(file_exists($pngfile))
            {
              // With a png, display that rather than call resource overhead for Flash display
              $out= "<img src='$pngfile' alt='$alt' $cstyle  $ido $classo/>";
              if(!$return) echo $out;
              else return $out;
            }
          else
            {
              // Fallback to Flash SVG display.
              if(!is_numeric($width)) 
                {
                  $ostyle .=" width='100px'"; // IE requires a width and height. If not specified, default to 100x100.
                  $width=100;
                }
              if(!is_numeric($height)) $ostyle .= " height='$width" . "px'";
              $out= "<object data='$resource' type='image/svg+xml' $ostyle $ido $classo>";
              if(browser_detection('number')>=8) $out.= $alt;
              $out.= "</object>";
              if(!$return) echo $out;
              else return $out;
            }
        }
      else 
        {
          $out= "<img src='$resource' alt='$alt' $cstyle  $ido $classo/>";
          if(!$return) echo $out;
          else return $out;
        }
    }
  else // if browser detection fails, fall back to most common resource inclusion.
    {
      $out= "<img src='$resource' alt='$alt' $cstyle  $ido $classo/>";
      if(!$return) echo $out;
      else return $out;
    }

}


function embedVideo($file, $width=NULL,$height=NULL,$title=NULL,$poster=NULL,$cid=NULL,$force_mime=TRUE)
{
  // code based on http://camendesign.com/code/video_for_everybody
  // encode video used by this as Ogg and h.264 / mp4
  // Make sure the $file provided is the FULL URL to the files, with no extension
  if($width==NULL) $width=640;
  if($height==NULL) $height=360;
  if($poster!=NULL) 
    {
      $flashposter = "&amp;image=$poster";
      $posterold=$poster;
      $poster = "poster='" . $poster . "'";
    }
  else $flashposter="";
  $objheight = $height + 15;
  $swfheight = $height + 20;
  if(!empty($cid)) $cid="id='$cid'";
  echo "<div class='video-js-box' $cid>
       <video width='$width' height='$height' class='video-js' $poster controls='controls' preload='preload'>";
  if ($force_mime) 
    {
      //Mimetype fix for certain server configurations
      $location=explode("/",$file);
      $len=sizeof($location);
      $location[$len-1]="?name=" . $location[$len-1];
      $fileold=$file;
      $file2=implode("/",$location);
    }
  // This source ordering will change once iPod/iPhone/iPad support playing with source != mp4 first
  // Support Open-Source Software!
  echo "\n	<source src='$file.mp4' type='video/mp4; codecs=\"avc1.42E101E, mp4a.40.2\"' />
        <source src='$file.webm' type='video/webm; codecs=\"vp8, vorbis\"' />\n";
    if ($force_mime) $file=$file2;
    echo "	<source src='$file.ogv' type='video/ogg; codecs=\"theora, vorbis\"' />"; 
    if ($force_mime) $file=$fileold;
    //  echo "\n	<source src='$file.mp4' type='video/mp4; codecs=\"avc1.42E101E, mp4a.40.2\"' />\n";
    if(empty($poster)) $iem="        <img src='modular/no_vid.png' width='$width' height='$width' alt='$title' title='No video playback capabilities.' id='novidi'/>";
    else $iem="        <img src='$posterold' width='$width' height='$width' alt='$title' title='$title' id='novidi'/>";
// Video JS code follows
    echo "      <object class='vjs-flash-fallback' width='$width' height='$height' type='application/x-shockwave-flash'
        data='http://releases.flowplayer.org/swf/flowplayer-3.2.2.swf'>
        <param name='movie' value='http://releases.flowplayer.org/swf/flowplayer-3.2.2.swf' />
        <param name='allowfullscreen' value='true' />
        <param name='flashvars' value='config={\"clip\":{\"url\":\"$file.mp4\",\"autoPlay\":false,\"autoBuffering\":true}}' />
        $iem
      </object>
    </video>
    <p class='vjs-no-video' id='novidp'>Your video will become available once it has buffered.<br/><strong>Download Video:</strong>
      <a href='$file.webm'>WebM</a>, 
      <a href='$file.ogg'>Ogg</a>, 
      <a href='$file.mp4'>MP4</a><br/>
<!-- Video player based on VideoJS.com 's implementation. Inquire at velociraptorsystems.com for XML compatible, single-line implementation -->
    </p>
  </div>";
}

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

function isHere($page,$title) {
  if(strtolower($page) == strtolower($title)) echo " class='here'";
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


function read_rss($url=null,$random=false)
{

  if($url==null) $url='http://maasaisafaris.com/blog/?feed=rss2';

  $ch = curl_init("$url");
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_HEADER, 0);
  $data = curl_exec($ch);
  curl_close($ch);
  
  $rss_contents=$data;

  $shortcontents=$rss_contents;
  $cont_backup=$shortcontents;

  $item1="<item>";
  $item2="</item>";
  
  $content_array=array();
  $entry="Blank";
  // Parse RSS feed into elements in $content_array
  while ($entry !== false)
    {
      $pos=strpos($shortcontents,$item1); // Find new item position
      if ($pos !== false)
        {
          $entry=substr($shortcontents,$pos);
          $shortcontents=substr($entry,$pos+2); // partially truncate shortcontents for next search
          $pos2=strpos($entry,$item2);
          $entry=substr($entry,0,$pos2); // Take only block of a single item
          array_push($content_array,$entry);
        }
      else $entry=$pos;
    }
  
  $key=array("TITLE","DESCRIPTION","LINK");
  $p_jobs=array();
  
  $n=sizeof($content_array);
  $i=0;
  
  $link1="<link>";
  $link2="</link>";
  $des1="<description>";
  $des2="</description>";
  $title1="<title>";
  $title2="</title>";
  
  // Extract elements
  while ($i < $n)
    {
      $entry=$content_array[$i];
      $e_link=substr($entry,strpos($entry,$link1)); // link on
      $e_link=substr($e_link,6,strpos($e_link,$link2)-6); // to end of link 15
      $e_des=substr($entry,strpos($entry,$des1));
      $e_des=substr($e_des,13,strpos($e_des,$des2)-13); // 22
      $e_title=substr($entry,strpos($entry,$title1));
      $e_title=substr($e_title,7,strpos($e_title,$title2)-7); // 16
      $info=array($e_title,$e_des,$e_link);
      //$p_entry=array_combine($key,$info); // PHP 5 needed
      $p_entry=$info;
      array_push($p_jobs,$p_entry); // push this last entry onto the end of p_jobs
      $i++;
    }
  
  if($random) $rnum=rand(0,$n);
  else $rnum=0;
  
  $r_entry=$p_jobs[$rnum];

  $tval=$r_entry[0];
  $dval=substr(substr($r_entry[1],9),0,-3);
  $lval=$r_entry[2];
  
  if ($tval!="") 
    {
      return "<h3>$tval</h3><p>$dval</p>";
    }
  else return false;
}


function getTagContents($string,$tag)
{
  if(strpos($tag,"<")===FALSE) $tag .= "<";
  if(strpos($tag,">")===FALSE) $tag = $tag . ">";
  $pos=strpos($string,$tag);
  if($pos!==FALSE)
    {
      $val=substr($string,$pos+strlen($tag));
      $val=explode("</" . str_replace("<","",str_replace(">","",$tag)),$val);
      return $val[0]; // always the first one
    }
  else return FALSE;
}

function encryptThis($data,$password,$add_salt=null)
{
  /* // Do encryptions. Expects 24-bit keys. */
  /* $iv_size = mcrypt_get_iv_size(MCRYPT_RIJNDAEL_256, MCRYPT_MODE_CTR); */
  /* $iv = mcrypt_create_iv($iv_size, MCRYPT_RAND); */
  /* $crypttext = base64_encode(mcrypt_encrypt(MCRYPT_RIJNDAEL_256, $key, $data, MCRYPT_MODE_CTR, $iv)); */
  /* if($array)  return array($crypttext,$iv); */
  /* else return $iv . $crypttext; */
  $cryptastic=new cryptastic;
  $key=createKey($password,$add_salt);
  //if(empty($add_salt)) $salt=createSalt();
  //else $salt=$add_salt;
  $encrypted=$cryptastic->encrypt($data,$key[0],true); // use key[0]
  return array($encrypted,$key[1]); // return salt
}

function decryptThis($data,$password,$salt,$iv=null)
{
  /* // Do decryptions */
  /* $iv_size = mcrypt_get_iv_size(MCRYPT_RIJNDAEL_256, MCRYPT_MODE_CTR); */
  /* //$iv = mcrypt_create_iv($iv_size, MCRYPT_RAND);  */
  /* if(empty($iv))  */
  /*   { */
  /*     $iv=substr($data,0,$iv_size); */
  /*     $data=substr($data,$iv_size); */
  /*   } */
  /* $result = mcrypt_decrypt(MCRYPT_RIJNDAEL_256, $key, base64_decode($data), MCRYPT_MODE_CTR, $iv); */
  /* $result=rtrim($result,"\0"); */
  /* return $result; */
  // Requires the password and the random salt from the encryption.
  $cryptastic=new cryptastic;
  //$key=createKey($password,$salt);
  $result=$cryptastic->decrypt($data,$password,true);
  $result=rtrim($result,"\0");
  $result=substr($result,32);
  return $result;
}

function createSalt($length=32,$add_entropy=null)
{
  $id1=uniqid(mt_rand(),true);
  $id2=md5(date('dDjlSwzWFmMntLYayABgGhiHsOZ'));
  $id3=crc32(curPageURL());
  $charset="!@#~`%^&*()-_+={}|[]:;'<>?,./";
  $repeats=rand(0,64);
  $i=0;
  $csl=strlen($charset);
  while($i<$repeats)
    {
      $pos=rand(0,$csl-1);
      $id4=substr($charset,$pos,1);
      $i++;
    }
  $salt=sha1($id2 . $id1 . $id3 . $id4 . $add_entropy); // add extra entropy if provided.
  $len=strlen($salt);
  if($length>$len) $length=$len;
  $diff=strlen($salt)-$length;
  $offset=rand(0,$diff);
  return substr($salt,$offset,$length);
}

function createKey($password,$salt=null,$add_salts=null)
{
  $cryptastic=new cryptastic;
  if(empty($salt)) $salt=createSalt(32,$add_salts);
  $key=$cryptastic->pbkdf2($password,$salt,25000,32);
  // Save this key -- it is unique and can't be regenerated
  return array($key,$salt);
}

//--------------------------------
class cryptastic {

	/** Encryption Procedure
	 *
	 *	@param   mixed    msg      message/data
	 *	@param   string   k        encryption key
	 *	@param   boolean  base64   base64 encode result
	 *
	 *	@return  string   iv+ciphertext+mac or
	 *           boolean  false on error
   */
	public function encrypt( $msg, $k, $base64 = false ) {

		// open cipher module (do not change cipher/mode)
		if ( ! $td = mcrypt_module_open('rijndael-256', '', 'ctr', '') )
			return false;

		$msg = serialize($msg);							// serialize
		$iv  = mcrypt_create_iv(32, MCRYPT_RAND);		// create iv

		if ( mcrypt_generic_init($td, $k, $iv) !== 0 )	// initialize buffers
			return false;

		$msg  = mcrypt_generic($td, $msg);				// encrypt
		$msg  = $iv . $msg;								// prepend iv
		$mac  = $this->pbkdf2($msg, $k, 1000, 32);		// create mac
		$msg .= $mac;									// append mac

		mcrypt_generic_deinit($td);						// clear buffers
		mcrypt_module_close($td);						// close cipher module

		if ( $base64 ) $msg = base64_encode($msg);		// base64 encode?

		return $msg;									// return iv+ciphertext+mac
	}

	/** Decryption Procedure
	 *
	 *	@param   string   msg      output from encrypt()
	 *	@param   string   k        encryption key
	 *	@param   boolean  base64   base64 decode msg
	 *
	 *	@return  string   original message/data or
	 *           boolean  false on error
   */
	public function decrypt( $msg, $k, $base64 = false ) {

		if ( $base64 ) $msg = base64_decode($msg);			// base64 decode?

		// open cipher module (do not change cipher/mode)
		if ( ! $td = mcrypt_module_open('rijndael-256', '', 'ctr', '') )
			return false;

		$iv  = substr($msg, 0, 32);							// extract iv
		$mo  = strlen($msg) - 32;							// mac offset
		$em  = substr($msg, $mo);							// extract mac
		$msg = substr($msg, 32, strlen($msg)-64);			// extract ciphertext
		$mac = $this->pbkdf2($iv . $msg, $k, 1000, 32);		// create mac

		if ( $em !== $mac )									// authenticate mac
			return false;

		if ( mcrypt_generic_init($td, $k, $iv) !== 0 )		// initialize buffers
			return false;

		$msg = mdecrypt_generic($td, $msg);					// decrypt
		$msg = unserialize($msg);							// unserialize

		mcrypt_generic_deinit($td);							// clear buffers
		mcrypt_module_close($td);							// close cipher module

		return $msg;										// return original msg
	}

	/** PBKDF2 Implementation (as described in RFC 2898);
	 *
	 *	@param   string  p   password
	 *	@param   string  s   salt
	 *	@param   int     c   iteration count (use 1000 or higher)
	 *	@param   int     kl  derived key length
	 *	@param   string  a   hash algorithm
	 *
	 *	@return  string  derived key
   */
	public function pbkdf2( $p, $s, $c, $kl, $a = 'sha256' ) {

		$hl = strlen(hash($a, null, true));	// Hash length
		$kb = ceil($kl / $hl);				// Key blocks to compute
		$dk = '';							// Derived key

		// Create key
		for ( $block = 1; $block <= $kb; $block ++ ) {

			// Initial hash for this block
			$ib = $b = hash_hmac($a, $s . pack('N', $block), $p, true);

			// Perform block iterations
			for ( $i = 1; $i < $c; $i ++ ) 

				// XOR each iterate
				$ib ^= ($b = hash_hmac($a, $b, $p, true));

			$dk .= $ib; // Append iterated block
		}

		// Return derived key of correct length
		return substr($dk, 0, $kl);
	}
}

function sha($data,$salt=null,$use=null,$forcesalt=true,$rounds=10000)
{
  //hashes with most secure algorithm and returns the hash used
  if(!empty($use)) $userset=true;
  else $userset=false;
  if($salt==null && $forcesalt===true) $salt=genUnique();
  if(!is_numeric($rounds)) $rounds=10000;
  if(function_exists('hash'))
    {
      // All more advanced algos also mean that hash() can be used
      $list=hash_algos();
      if(empty($use))
        {
          foreach($list as $algo)
            {
              if($algo=='sha512')
                {
                  $use=$algo;
                  break;
                }
              if($algo=='sha384')
                {
                  $use=$algo;
                }
              if($algo=='sha256')
                {
                  if($use!='sha384') $use=$algo;
                }
              if($algo=='sha224')
                {
                  if($use!='sha384' && $use!='sha256') $use=$algo;
                }
            }
        }
      if(!empty($use))
        {
          if($salt!=null) 
            {
              if(strpos($use,"crypt")>0) 
                {
                  // strip the "crypt" from the algo name and mark that it's wanted
                  $use_crypt=true;
                  $use=str_replace("crypt","",$use);
                }
              if(strpos($use,"pbkdf2")>0) 
                {
                  // strip the "pbkdf2" from the algo name and mark that it's wanted
                  $use_pbkdf2=true;
                  $use=str_replace("pbkdf2","",$use);
                }
              $cryptgo=false;
              if(CRYPT_SHA512==1 && $use=='sha512') $cryptgo=true;
              else if(CRYPT_SHA256==1 && $use=='sha256') $cryptgo=true;
              else if(CRYPT_BLOWFISH==1) 
                {
                  $cryptgo=true;
                  $use='blowfish';
                }
              else if($use_crypt) return array(false,"Crypt was required but the requested algorithm $use isn't available");
              if(function_exists('hash_pbkdf2') && $use_crypt!==true) return array("hash"=>hash_pbkdf2($use,$data,$salt,$rounds),"salt"=>$salt,"algo"=>$use."pbkdf2","rounds"=>$rounds);
              else if(function_exists('crypt') && ($use_crypt || !$userset) && $cryptgo)
                {
                  // implement crypt fallback
                  //if(!empty(CRYPT_SALT_LENGTH)) $salt=substr($salt,0,CRYPT_SALT_LENGTH);
                  $data=urlencode($data);
                  switch($use)
                    {
                    case "sha512":
                      $salt=substr($salt,0,16);
                      $ss="\$6\$rounds=$rounds\$".$salt."\$";
                      break;
                    case "sha256":
                      $salt=substr($salt,0,16);
                      $ss="\$5\$rounds=$rounds\$".$salt."\$";
                      break;
                    case "blowfish":
                      $salt=substr(sha1($salt),0,22);
                      $ss="\$2a\$07\$".$salt."\$";
                      break;
                    default:
                      $ss=false;
                    }
                  if($ss!=false)
                    {
                      // do crypt
                      $result=crypt($data,$ss);
                      $result_small=explode("\$",$result);
                      $size=sizeof($result_small);
                      $result_small=$result_small[$size-1]; // trim the extra data in case the user wants an unadulterated hash.
                      return array('hash'=>$result_small,"full_hash"=>$result,"salt"=>$salt,"algo"=>$use."crypt","rounds"=>$rounds,"string"=>$ss);
                    } // End crypt cases. Now all sophisticated algorithms supported by the system have been exhausted. Use basic hasher.
                  else 
                    {
                      // check flag for simple looped hash, do that if called, else just do a data+salt
                      if(function_exists('hash_hmac') && strpos($use,"_hmac")!==false) return array('hash'=>hash_hmac($use,$salt.$data,$salt),"salt"=>$salt,"algo"=>$use."_hmac");
                      else if(!function_exists('hash_hmac') && strpos($use,"_hmac")!==false) return false;
                      return array('hash'=>hash($use,$salt.$data),"salt"=>$salt,"algo"=>$use);
                    }
                } // End using crypt
              else if(!function_exists('crypt') && $use_crypt) return false;
              else if(!function_exists('hash_pbkdf2') && ($use_pbkdf2 || !$userset)) 
                {
                  try
                    {
                      // try non-native implmentation of pbkdf2
                      @require_once('modular/pbkdf2.php');
                      $hash=pbkdf2($use,$data,$salt,$rounds,128);
                      return array('hash'=>$hash,"salt"=>$salt,"algo"=>$use."pbkdf2","rounds"=>$rounds);
                    }
                  catch(Exception $e)
                    {
                      if($use_pbkdf2) return false; 
                    }
                }
              if(function_exists('hash_hmac'))
                { 
                  if($userset && strpos($use,"_hmac")!==false) return array('hash'=>hash_hmac(str_replace("_hmac","",$use),$salt.$data,$salt),"salt"=>$salt,"algo"=>$use);
                  if(!$userset) return array('hash'=>hash_hmac($use,$salt.$data,$salt),"salt"=>$salt,"algo"=>$use."_hmac");
                }
              else if(!function_exists('hash_hmac') && strpos($use,"_hmac")!==false && $userset) return false;
              return array('hash'=>hash($use,$salt.$data),"salt"=>$salt,"algo"=>$use);
            } // End salt-requring functions
          else return array('hash'=>hash($use,$salt.$data),"salt"=>$salt,"algo"=>$use);
        } // End search for supported hash algos
      else return array('hash'=>sha1($salt.$data),"salt"=>$salt,"algo"=>'sha1');
    } // End hash() supported
  return array('hash'=>sha1($salt.$data),"salt"=>$salt,"algo"=>'sha1');
}

function genUnique($len=128)
{
  /*
  // Very slow unique string generator. 
  // Uses PHP rand(), computer time, current URL, best sha hash, and a true random value from random.org
  */
  $id1=createSalt();
  $id2=microtime_float();
  $id3=rand(0,10000000000);
  $id4_1=createSalt(64);
  $id4_2=$_SERVER['request_uri'];
  $id4_3=microtime_float();
  $id4_4=$id4_1.$id4_2.$id4;
  $id4=sha1($id4_4.createSalt(128));
  // random.org input
  $rurl='http://www.random.org/strings/?num=1&len=20&digits=on&upperalpha=on&loweralpha=on&format=plain&rnd=new';
  $string=@file_get_contents($rurl);
  $seed=$string.$id1.$id2.$id3.$id4;
  $hash=hash('sha512',$seed);
  $rethash=substr($hash,0,$len);
  return $rethash;
}

function extractEncrypted($xml,$tag,$key,$salt)
{
  $data=getTagContents($xml,$tag);
  if(!empty($data))
    {
      $p_data=decryptThis($data,$key,$salt);
      if(!empty($p_data)) return $p_data;
      else return false;
    }
  else return false;
}

function lookupUser($username,$pw,$return=false)
{
  // check it's a valid email! validation skipped.
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
      $algo=getTagContents($userdata['data'],"<algo>");
      /*
        if(strpos($algo,"_pbkdf2")!==false || strpos($algo,"_crypt")!==false ) $pw1=sha($input,$salt);
        else $pw1=sha($input);
      */
      // temp for old accounts
      if($algo=='sha512') $saltin="";
      else $saltin=$salt;
      // end temp for old accounts
      $rounds=getTagContents($userdata['data'],"<rounds>");
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

function updateTag($string,$tag,$newcontents)
{
  $string = preg_replace( '/\s+/', ' ', $string ); // trim whitespace
  $pos=strpos($string,$tag);
  if($pos!==FALSE)
    {
      $bval=substr($string,0,$pos+strlen($tag));
      //$val=substr($string,$pos+strlen($tag));
      $ctag="</" . str_replace("<","",$tag);
      $eval=$string;
      $pos=strpos($eval,$ctag);
      while($pos!==false)
        {
          // keep trimming
          $eval=substr($eval,$pos+strlen($ctag));
          $pos=strpos($eval,$ctag);
        }
      return $bval . $newcontents . $ctag . $eval; // always the first one
    }
  else
    {
      // concatenate onto end
      $pos=strpos($string,"</xml>");
      if($pos===false) 
        {
          $pos=strlen($string);
          $cxml=null;
        }
      else $cxml="</xml>";
      $bval=substr($string,0,$pos);
      if(strpos($newcontents,$tag)!==false) $tag=null;
      else $ctag="</" . str_replace("<","",$tag);
      $new=$bval.$tag.$newcontents.$ctag.$cxml;
      return $new;
    }
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
function getTagAttributes($string,$tag,$all=false)
{
  // return [[attribute,value],[attribute,value],...] for all attributes in <$tag>
  $tag=str_replace("<","",$tag);
  $tag=str_replace(">","",$tag);
  $tag="<".$tag;
  $pos=strpos($string,$tag);
  if($pos!==false)
    {
      // found a valid tag
      // return all attribute values for a given tag
      $all_tags=explode($tag,$string);
      // it should never be the first iterator. Kill it.
      $all_tags=array_slice($all_tags,1);
      if($all) $parent_array=array();
      foreach($all_tags as $sstring)
        {
          $pos2=strpos($sstring,">");
          $sstring=substr($sstring,0,$pos2);
          if(empty($sstring) && !$all) return false; // this means that the tag has no attributes
          if(!empty($sstring))
            {
              $attributes=preg_split("/[\"'] +/",$sstring);
              // iterate through $attributes, and break each attribute pair into a subarray
              $result_array=array();
              foreach($attributes as $attribute)
                {
                  $pair=explode("=",$attribute);
                  $i=0;
                  foreach($pair as $value) 
                    {
                      // remove leading or trailing quote
                      $value=str_replace('"',"",$value);
                      $value=str_replace("'","",$value);
                      $value=str_replace("&#39;","",$value);
                      $pair[$i]=trim($value);
                      $i++;
                    }
                  $result_array[]=$pair;
                }
              if(!$all) return $result_array;
            }
          // This means $all has been declared
          // stuff into larger parent array
          if(empty($sstring)) $parent_array[]=false;
          else $parent_array[]=$result_array;
        }
      // take large parent array and return that
      return $parent_array;
    }
  return false;
}
function getTagAttribute($string,$tag,$attribute)
{
  $tag=str_replace("<","",$tag);
  $tag=str_replace(">","",$tag);
  $tag="<".$tag;
  $pos=strpos($string,$tag);
  if($pos!==false)
    {
      // Found at least one tag
      $all_tags=explode($tag,$string);
      foreach($all_tags as $sstring)
        {
          $pos2=strpos($sstring,">");
          $sstring=substr($sstring,0,$pos2);
          $attributes=preg_split("/[\"'] +/",$sstring);
          // Loop over all attributes
          foreach($attributes as $test)
            {
              $test=trim($test);
              if(strpos($test,$attribute)!==false)
                {
                  // Potential attribute match
                  $pos3=strpos($test,"=");
                  if(substr($test,0,$pos3+1)==$attribute."=")
                    {
                      // Good value found
                      $value=substr($test,$pos3+2);
                      $quote=strpos($value,"'");
                      if($quote!==false) $value=substr($value,0,$quote);
                      return $value;
                    }
                  // keep looping if not found
                }
            } // Attribute not found in list of attributes for this tag. 
        } // This tag instance fails. Repeat
      return false; // no results
    }
  else return false;

}

function setTagAttribute($string,$tag,$attribute,$attvalue,$onematch=true,$retstring=true,$debug=false)
{
  // For a given tag, set an attribute value.
  $matched=false;
  $retmatch=false;
  $tag=str_replace("<","",$tag);
  $tag=str_replace(">","",$tag);
  $tag="<".$tag;
  $pos=strpos($string,$tag);
  if($pos!==false)
    {
      // Found at least one tag
      $all_tags=explode($tag,$string);
      if($debug) { 
        echo "<!-- perseverate! ";
        print_r($all_tags);
        echo "-->";
      }
      foreach($all_tags as $sstring)
	      {
	        $pos2=strpos($sstring,">");
          // if index starts with < , it could be a surious set of tag matches .. .should be skipped
          if(substr($sstring,0,1)!="<" && !empty($sstring))
            {
              $ss_old=$sstring;
              $sstring=substr($sstring,0,$pos2); // text string of tag
              //#echo displayDebug("Extracted ".$sstring."\n");
              $attributes=preg_split("/[\"'] +/",$sstring); // match against truncated string
            }
          else $attributes=array(); // it'll skip the foreach loop
	        // Loop over all attributes
	        foreach($attributes as $test)
	          {
              $test=trim($test);
              //#echo "Running against \"$test\" in tag...\n";
	            if(strpos($test,$attribute)!==false && $matched===false)
                {      
                  // Potential attribute match
                  $pos3=strpos($test,"=");
                  $matchstring=$attribute."=";
                  if(substr($test,0,$pos3+1)==$matchstring)
                    {
                      // Matching attribute found
                      //#echo displayDebug("Testing $test against $matchstring \n");
                      $value=substr($test,$pos3+2); // old attribute value
                      if($value==$attvalue) 
                        {
                          if($onematch) $matched=true; // so it won't find subsequent instances
                          $retmatch=true; // for the purposes of returning, a match was found
                        }
                      else
                        {
                          // stitch together a new tag
                          if($onematch) $matched=true; // so it won't find subsequent instances
                          $retmatch=true; // for the purposes of returning, a match was found
                          $newtag=trim($tag);
                          foreach($attributes as $el)
                            {
                              if(strpos($el,$matchstring)===false) 
                                {
                                  if(substr($el,-1)=="'") $el=substr($el,0,-1);
                                  $newtag.=" ".$el."'";
                                  //#echo "Stiched on \"$el\" \n";
                                }
                              else
                                {
                                  // sanitize out the attribute value
                                  $elout=$matchstring."'".$attvalue."'";
                                  $newtag.=" ".$elout;
                                }
                            }
                          // put the rest of the tag info on
                          $newtag=$newtag.substr($ss_old,$pos2);
                          //#echo "This is the tag: ".displayDebug($newtag). "\n\n";
                          break; // break out of the foreach loop
                        }
                    }
                  // keep looping if not found
                }
              else if($matched===true) $sstring=trim($tag).$ss_old; // to properly fill in
	          } // Attribute not found in list of attributes for this tag. 
          if(!empty($newtag)) $sstring=$newtag; // break the tag seach
          $newtag=""; // empty out new tag
          $new_buffer.=$sstring;
          //#echo "Current buffer: ".displayDebug($new_buffer)."\n\n";
	      } // This tag instance fails. Repeat next tag
      //#echo "Finshed iterating over all_tags.\n";
      if(!$retmatch)
        {
          // no match, but there is a tag. Add the attribute.
          // start with $string, since no changes have been made.
          if($debug) echo "<!-- This is what we're checking -->";
          $i=0;
          // Re-find the tag, append to instances as specified.
          foreach($all_tags as $sstring)
            {
              $pos2=strpos($sstring,">");
              if(substr($sstring,0,1)!="<" && !empty($sstring))
                {
                  // fix appending to first tag
                  //if($i=0) $i=1; // since the implode will throw the tag between [0] and [1]
                  $all_tags[$i]=" ".$attribute."='".$attvalue."'".$sstring;
                  if($debug) echo "<!-- Just set alltags element $i: .".$all_tags[$i]." -->";  
                  if($onematch) break;
                }
              $i++;
            }
          if($debug) echo displayDebug(print_r($all_tags,true));
          $new_buffer=implode($tag,$all_tags);
        }
      if($retstring) return $new_buffer;
      else return true;
    }
  // If no tag matches at all, return a failure or the same string. Don't create a new tag.
  if($retstring) return $string; // no change
  else return false; // found no matching tags at all
}

function geocodeZip($zip=null,$street=null,$size=null,$provider='osm',$returnlink=false,$sensor=false,$retry=false,$error_code=null)
{
  // based on API provided at http://goo.gl/majc
  if($street==null)$attach=$zip;
  else if($street!=null)
    {
      $street=str_replace(" ","+",$street);
      $attach=$street."+$zip";
    }
  else return array(false,"No location provided (Empty ZIP code and street address)");
  $ssensor=strbool($sensor);
  if($provider=='google') $url="https://maps.googleapis.com/maps/api/geocode/xml?address=".$attach."&sensor=$ssensor";
  else if($provider=='osm') $url="http://nominatim.openstreetmap.org/search?q=".$attach."&format=xml&polygon=0&email=webmaster@reallyactivepeople.com"; // results are not coded as easily as they could be to read. also, no location accuracy.
  else 
    {
      if($retry) return array(false, $error_code." and a bad provider was given ($provider)");
      else return geocodeZip($zip,$street,$size,null,$returnlink,$sensor,true,"Bad provider was given ($provider)");
    }

  $opts=array('http'=>array('timeout'=>60));
  $context=@stream_context_create($opts);

  if($provider=='osm')
    {
      if($returnlink) return "http://nominatim.openstreetmap.org/search?q=".$attach;
      $result=@file_get_contents($url,false,$context);
      if($result===false) 
        {
          if($retry) return array(false, $error_code." and OpenStreetMap failed to respond.");
          else return geocodeZip($zip,$street,$size,'google',$returnlink,$sensor,true,"OpenStreetMap failed to respond.");
        }
      if($attach!=$zip) $ltype="<location_type>INTERPOLATED</location_type>";
      else $ltype="<location_type>APPROXIMATE</location_type>";
      $lat=getTagAttribute($result,"place","lat");
      if($lat===false) 
        {
          if($retry) return array(false,$error_code." and OpenStreetMap could not find \"$street $zip\"");
          else return geocodeZip($zip,$street,$size,'google',$returnlink,$sensor,true,"OpenStreetMap could not find \"$street $zip\"");
        }
      $long=getTagAttribute($result,"place","lon");
      $location="<location><lat>".$lat."</lat><lng>".$long."</lng></location>";
      $formatted=getTagAttribute($result,"place","display_name");
      $retval=array($location,$ltype,null,null,$formatted,$retry,$error_code);
      return $retval;
    }
  if($provider=='google')
    {
      $result=@file_get_contents($url,false,$context);
      if($result===false) 
        {
          if($retry) return array(false,$error_code." and Google Maps failed to respond.");
          else return geocodeZip($zip,$street,$size,'osm',$returnlink,$sensor,true,"Google Maps failed to respond.");
        }
      $status=getTagContents($result,"<status>");
      if($status!="OK") 
        {
          if($retry) return array(false,$error_code." and Google Maps failed with result <code>$status</code> for \"$street $zip\".");
          else return geocodeZip($zip,$street,$size,'google',$returnlink,$sensor,true,"Google Maps failed with result <code>$status</code> for \"$street $zip\".");
        }
      $lint=getTagContents($result,"<location>");
      if($lint!==false)
        {
          $location="<location>".$lint."</location>";
          $ltype="<location_type>".getTagContents($result,"<location_type>")."</location_type>";
          $lat=getTagContents($location,"<lat>");
          $long=getTagContents($location,"<lng>");
          $formatted=getTagContents($result,"<formatted_address>");
          // Google compliance: Display a map
          if($size==null)$size="256x256";
          $iurl="https://maps.googleapis.com/maps/api/staticmap?markers=label:A%7Ccolor:green%7C$lat".","."$long&amp;size=".$size."&amp;zoom=13&amp;sensor=$ssensor";
          if($returnlink) return $iurl;
          $retval=array($location,$ltype,$iurl,$size,$formatted,$retry,$error_code);
          return $retval;
        }
    }
}

function getPointDistance($lat1,$lng1,$lat2,$lng2,$round=2,$unit='km')
{
  if($unit=='mi') $const=3959;
  else $const=6371; // Earth volumetric mean radius
  $check=array($lat1,$lat2,$lng1,$lng2);
  foreach($check as $number)
    {
      if(!is_numeric($number)) return false;
    }
  $haversine=acos(cos(deg2rad($lat1))*cos(deg2rad($lat2))*cos(deg2rad($lng2)-deg2rad($lng1))+sin(deg2rad($lat1))*sin(deg2rad($lat2)));
  $distance=$const*$haversine;
  return round($distance,$round);

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

function getLocation($xml,$prefercookie=false)
{
  $location=getTagContents($xml,"<location>");
  if(empty($location) || $prefercookie) 
    {
      global $cookiename;
      $cookielat=$cookiename."_lat";
      $cookielng=$cookiename."_lng";
      if(!empty($_REQUEST['lat']))
        {
          $location="<lat>".$_REQUEST['lat']."</lat><lng>".$_REQUEST['long']."</lng>";
          $sensor='true';
        }
      else if(!empty($_COOKIE[$cookielat]))
        {
          $location="<lat>".$_COOKIE[$cookielat]."</lat><lng>".$_COOKIE[$cookielng]."</lng>";
          $sensor='true';
        }
    }
  else $sensor='false';
  if(!empty($location)) 
    {
      $ulat=getTagContents($location,"<lat>");
      $ulng=getTagContents($location,"<lng>");
      return array($ulat,$ulng,$sensor);
    }
  else return array(false,false,$sensor);
}

function scrapeWebImages($url,$format=null)
{
  $data=@file_get_contents($url);
  if(!empty($data))
    {
      $list=explode("<img",$data);
      $imgtags=array();
      foreach($list as $element)
        {
          $pos=strpos($element,">");
          $shorttag=substr($element,0,$pos);
          $pos=strpos($shorttag,"src=");
          if($pos!==false)
            {
              $shorttag=substr($shorttag,$pos+4);
              $quote=substr($shorttag,0,1);
              $shorttag=substr($shorttag,1);
              $pos=strpos($shorttag,$quote);
              $shorttag=substr($shorttag,0,$pos);
              if(strpos($shorttag,"http://")===false) $shorttag=$url."/".$shorttag;
              if(array_find($shorttag,$imgtags)===false) $imgtags[]=$shorttag;
            }
        }
      return $imgtags;
    }
  else return false;
}
function embedLogo($url)
{
  $imgs=scrapeWebImages($url);
  $logo=array_find('logo',$imgs);
  if($logo==false) 
    {
      $sitebase=substr($url,7);
      $sitee=explode('.',$sitebase);
      $logo=array_find($sitee[1],$imgs);
    }
  if($logo!==false)
    {
      $limg=$imgs[$logo];
      if(strpos($limg,'svg')!==false)
        {
          return dispSVG($limg,'logo',null,null,null,'embedLogo',true);
        }
      else return "<img src='$limg' alt='logo' class='embedLogo'/>";
    }
  else return $imgs;
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
function getWeather($lat,$lng,$human=false,$json=false)
{
  $apikey="03da979c8e65825d2c2a9bd79062c742";
  $url="http://api.openweathermap.org/data/2.1/find/city?lat=".$lat."&lon=".$lng."&appid=".$apikey;
  $characters=array('temp','speed','deg','description');
  $json=@file_get_contents($url);
  $warray=readJSON($json);
  if(is_array($warray))
    {
      foreach($characters as $measure)
        {
          $point=getNestedKey($warray,$measure);
          $weather[$measure]=$point;
        }
      if(!$human) 
        {
          if(!$json) return $weather;
          else return json_encode($weather);
        }
      else
        {
          $weather['temp']=doubleval($weather['temp'])-273.15;
          $weather['temp'].=" C";
          $weather['speed'].=" m/s";
          $dir=$weather['deg'];
          if($dir>348.75) $weather['deg']="N";
          if($dir<337.5) $weather['deg']="NxNW";
          if($dir<315) $weather['deg']="NW";
          if($dir<292.5) $weather['deg']="WxNW";
          if($dir<270) $weather['deg']="W";
          if($dir<247.5) $weather['deg']="WxSW";
          if($dir<225) $weather['deg']="SW";
          if($dir<202.5) $weather['deg']="SxSW";
          if($dir<180) $weather['deg']="S";
          if($dir<157.5) $weather['deg']="SxSE";
          if($dir<135) $weather['deg']="SE";
          if($dir<112.5) $weather['deg']="ExSE";
          if($dir<90) $weather['deg']="E";
          if($dir<67.5) $weather['deg']="ExNE";
          if($dir<45) $weather['deg']="NE";
          if($dir<22.5) $weather['deg']="NxNE";
          if($dir<11.25) $weather['deg']="N";
          $weather['description']=ucwords($weather['description']);
          if(!$json) return $weather;
          else return json_encode($weather);
        }
    }
  else return false;
}

function getPlusStatus($from,$to,$act) {
  // Return true if given, false if not
  $result=lookupItem($from,'hardlink',null,null,false);
  $fromarr=@mysqli_fetch_assoc($result);
  $fromdata=$fromarr['data'];
  $fromplusdata=getTagContents($fromdata,"<givenPlusses>");
  if($fromplusdata!==false)
    {
      $actstring="ACT:$act";
      $tag="<".$actstring.">";
      $al=getTagContents($fromplusdata,$tag);
      if($al!==false)
        {
          // hash collision chance is nearly zero. No need to search the exploded array
          if(strpos($al,$to)!==false) return true;
        }
      return false;
    }
  return false;
}

function getPlusRecentCount($userid,$interval=24,$unit='h') {
  if(!is_numeric($interval)) $interval=24;
  switch($unit)
    {
    case "s":
      break;
    case "m":
      $interval=$interval*60;
      break;
    case "h": 
      $interval=$interval*3600;
      break;
    case "d":
      $interval=$interval*3600*24;
      break;
    case "w":
      $interval=$interval*3600*24*7;
      break;
    case "y":
      $interval=$interval*3600*24*7*365.242199;
      break;
    default: 
      $interval=$interval*3600;
    }
  // Get the user's data
  $result=lookupItem($userid,'hardlink',null,null,false);
  $prodata=@mysqli_fetch_assoc($result);
  // Check the user's data
  $plusdata=getTagContents($prodata['data'],"<givenPlusses>");
  if($plusdata===false) return false;
  $recent=getTagContents($plusdata,"<recent>");
  // read the timestamps, iterate over and add to counter
  $recent_arr=explode(",",$recent);
  $now=microtime_float();
  $i=0;
  foreach($recent_arr as $time) if($time+$interval>$now) $i++;
  // return count
  return $i;
}

function getPlusCount($user,$activity) 
{
  $result=lookupItem($user,'hardlink',null,null,false);
  if($result!==false)
    {
      $arr=@mysqli_fetch_assoc($result);
      $data=$arr['data'];
      $plusdata=getTagContents($data,"<plusses>");
      $tag="<ACT:$activity>";
      if($plusdata!==false)
        {
          $as=getTagContents($plusdata,$tag);
          if($as!=false) return $as;
        }
      return "0";
    }
  return false;
}

function validateActivity($activity)
{
  $l=openDB();
  $query="SELECT dblink FROM activity_table WHERE dblink='$activity'";
  $result=mysqli_query($l,$query);
  if($result!=false) return mysqli_num_rows($result)>0;
  mysqli_close($l);
  return false;
}

function doesThis($activity,$user)
{
  // validate the user
  $result=lookupItem($user,'hardlink',null,null,false);
  if($result!==false)
    {
      $userdata=mysqli_fetch_assoc($result);
      $acts=$userdata['dblink'];
      // $acts is a string. Almost no chance of collision, can search string directly
      if(strpos($acts,$activity)!==false) return true;
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