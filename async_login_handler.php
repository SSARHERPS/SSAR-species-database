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
  $u=new UserFunctions();
  if($u->validateUser($id,$conf,$s))
    {
      // write the data
    }
  else
    {
      // invalid user
    }
}

?>