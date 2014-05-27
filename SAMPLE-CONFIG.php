<?php

/***
 * Update the variables in here and re-save as config.php for use.
 ***/

$captive_login=false; // pulls the user back to the main page if not logged in

$default_user_table='userdata';
$default_user_database="";
$default_sql_user="";
$default_sql_password=""; // https://www.random.org/passwords/?num=5&len=24&format=plain&rnd=new
$sql_url = 'localhost';

/***
 * Required, but free to generate. Generate here: 
 * https://www.google.com/recaptcha/admin/create
 ***/
$recaptcha_public_key="";
$recaptcha_private_key="";


/***
 * Very important! I suggest taking all three results and concatenating them
 ***/
$site_security_token=""; // https://www.random.org/passwords/?num=3&len=24&format=plain&rnd=new

/***
 * If not set, minimum password length defaults to 8, with a threshold of 20.
 ***/
$service_email='';
$minimum_password_length='';
$password_threshold_length='';

/***
 * Path to user data storage
 ***/
$user_data_storage='';
$profile_picture_storage = $user_data_storage.'';

/***

 $baseurl=""; // define if other than the hosted URL
 
***/

/***
 * If you edit this, change the mapping in login_functions.php
 ***/
$db_cols=array(
  "username"=>"text",
  "password"=>"text",
  "pass_meta"=>"text",
  "creation"=>"float(16)",
  "status_tracker"=>"text",
  "name"=>"text",
  "flag"=>"boolean",
  "admin_flag"=>"boolean",
  "su_flag"=>"boolean",
  "disabled"=>"boolean",
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

$user_column = "username";
$password_column = "password";
$cookie_ver_column = "auth_key";


?>