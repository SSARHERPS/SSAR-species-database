<?php

/***
 * Update the variables in here and re-save as config.php for use.
 ***/

$default_table='';
$default_database="";
$default_user="";
$default_password="";
$sql_url = 'localhost';

$recaptcha_public_key="";
$recaptcha_private_key="";

$service_email='';
$minimum_password_length='15';

$baseurl=""; // define if other than the hosted URL

$db_cols=array(
  "username"=>"text",
  "password"=>"text",
  "pass_meta"=>"text",
  "creation"=>"float(16)",
  "status_tracker"=>"text",
  "name"=>"text",
  "flag"=>"boolean",
  "admin_flag"=>"boolean",
  "su_flag"=>"boolean"
  "disabled"=>"boolean"
  "dtime"=>"int(8)",
  "last_ip"=>"varchar(32)",
  "last_login"=>"float(16)",
  "auth_key"=>"varchar(512)",
  "data"=>"text",
  "secdata"=>"text",
  "special_1"=>"text",
  "special_2"=>"text",
  "dblink"=>"varchar(255)",
  "defaults"=>"text",
  "public_key"=>"text",
  "private_key"=>"text"
);

?>