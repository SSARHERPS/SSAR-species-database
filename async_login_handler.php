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
  default:
    getLoginState($_REQUEST);
  }

function getLoginState($get)
{
  $conf=$get['hash'];
  $s=$get['secret'];
  $id=$get['dblink'];
  $u=new UserFunctions();
  returnAjax(array("status"=>$u->validateUser($id,$conf,$s)));
}


function saveToUser($get)
{
  // confirm
  $conf=$get['hash'];
  $s=$get['secret'];
  $id=$get['dblink'];
  if(!empty($conf) && !empty($s) && !empty($id) && !empty($get['data']) && !empty($get['col']))
    {
      $u=new UserFunctions();
      if($u->validateUser($id,$conf,$s))
        {
          // write the data
          // Yes, it looks up the validation again, but it is a more robust feedback like this
          // Could pass in get for validation data, but let's be more limited
          $val=array("dblink"=>$id,"hash"=>$conf,"secret"=>$s);
          returnAjax($u->writeToUser($get['data'],$get['col'],$val));
        }
      else returnAjax(array('status'=>false,'error'=>'Invalid user'));
    }
  returnAjax(array('status'=>false,'error'=>"One or more required fields were left blank"));
}

?>