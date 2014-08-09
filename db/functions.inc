<?php

if(!function_exists('curPageURL'))
  {

    function curPageURL() {
      $pageURL = 'http';
      if ($_SERVER["HTTPS"] == "on") {$pageURL .= "s";}
      $pageURL .= "://";
      if ($_SERVER["SERVER_PORT"] != "80") {
        $pageURL .= $_SERVER["SERVER_NAME"].":".$_SERVER["SERVER_PORT"].$_SERVER["REQUEST_URI"];
      } else {
        $pageURL .= $_SERVER["SERVER_NAME"].$_SERVER["REQUEST_URI"];
      }
      return DBHelper::cleanInput($pageURL);
    }
  }

if(!function_exists('appendQuery'))
  {

    function appendQuery($query) {
      $url = curPageURL();
      $url=str_replace("&","&amp;",$url);
      if(strpos($url,"?")!==FALSE) $url .= "&amp;" . $query;
      else $url .= "?" . $query;
      return $url;
    }
  }

if(!function_exists('debugDisplay'))
  {
    
    function debugDisplay($string)
    {
      if(is_array($string))
        {
          foreach($string as $k=>$el)
            {
              if(is_bool($el)) $string[$k]="(bool) ".strbool($el);
            }
          $string=print_r($string,true);
        }
      $string=str_replace("&","&amp;",$string);
      $string=str_replace("<","&lt;",$string);
      $string=str_replace(">","&gt;",$string);
      return "<pre style='background:white;color:black;'>".$string."</pre>";
    }
    function displayDebug($string){ return debugDisplay($string); }
  }

if(!function_exists('datestamp'))
  {
    function datestamp()
    {
      return date("Ymd-HisO");
    }
  }

if(!function_exists('array_find'))
  {
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
  }

if(!function_exists('do_post_request'))
  {

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
  }

if(!function_exists('emailThis'))
  {

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

  }

if(!function_exists('strbool'))
  {
    
    function strbool($bool)
    {
      // returns the string of a boolean as 'true' or 'false'.
      if(is_string($bool)) $bool=boolstr($bool); // if a string is passed, convert it to a bool
      if(is_bool($bool)) return $bool ? 'true' : 'false';
      else return 'non_bool';
    }
    function boolstr($string)
    {
      // returns the boolean of a string 'true' or 'false'
      if(is_string($string)) return strtolower($string)==='true' ? true:false;
      else if(is_bool($string)) return $string;
      else if(preg_match("/[0-1]/",$string)) return $string==1 ? true:false;
      else return false;
    }
  }

if(!function_exists('readJSON'))
  {

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

  }

if(!function_exists('encode64'))
  {

    function encode64($data) { return base64_encode($data); }
    function decode64($data) 
    {
      if(base64_encode(base64_decode($data,true))==$data) return urldecode(base64_decode($data));
      return false;
    }
  }

if(!function_exists('smart_decode64'))
  {

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
  }

if(!function_exists('deEscape'))
  {
    function deEscape($input) {
      return htmlspecialchars_decode(html_entity_decode(urldecode($input)));
    }
  }

?>