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
  print json_encode($data); //,JSON_FORCE_OBJECT); // PHP 5.3+ - http://www.php.net/json_encode
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
    returnAjax(saveTouser($_REQUEST));
    break;
  default:
    returnAjax(getLoginState($_REQUEST));
  }

function getLoginState($get)
{
  $conf=$get['hash'];
  $s=$get['secret'];
  $id=$get['dblink'];
  $u=new UserFunctions();
  return array("status"=>$u->validateUser($id,$conf,$s));
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
    'dblink'
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

?>