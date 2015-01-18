<?php

/***
 * Handle admin-specific requests
 ***/

$print_login_state = false;

require_once(dirname(__FILE__)."/admin/async_login_handler.php");

$start_script_timer = microtime_float();

if(!function_exists('elapsed'))
  {
    function elapsed($start_time = null)
    {
      /***
       * Return the duration since the start time in
       * milliseconds.
       * If no start time is provided, it'll try to use the global
       * variable $start_script_timer
       *
       * @param float $start_time in unix epoch. See http://us1.php.net/microtime
       ***/

      if(!is_numeric($start_time))
        {
          global $start_script_timer;
          if(is_numeric($start_script_timer)) $start_time = $start_script_timer;
          else return false;
        }
      return 1000*(microtime_float() - (float)$start_time);
    }
  }

$admin_req=isset($_REQUEST['perform']) ? strtolower($_REQUEST['perform']):null;

switch($admin_req)
  {
    # Stuff
  case "save":
    returnAjax()
    break;
  default:
    returnAjax(getLoginState($_REQUEST,true));
  }

function saveEntry($get)
{
  /***
   * Save a new taxon entry
   ***/
  $login_status = getLoginState($get);
  if($login_status["status"] !== true) return $login_status;
  # The login status was OK
  $data64 = $get["data"];
  $data_string = base64_decode($data64);
  $data = json_decode($data_string,true);
  if(!isset($data["id"]))
    {
      # The required attribute is missing
      return array("status"=>false,"error"=>"POST data attribute \"id\" is missing","human_error"=>"The request to the server was malformed. Please try again.");
    }
}

?>