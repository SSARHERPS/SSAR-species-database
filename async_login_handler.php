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

?>