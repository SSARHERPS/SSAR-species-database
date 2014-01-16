<?php

/***
 * Update the variables in here and re-save as config.php for use.
 ***/

$default_table='userdata';
$default_database="";
$default_user="";
$default_password=""; // https://www.random.org/passwords/?num=5&len=24&format=plain&rnd=new
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
 * If not set, minimum password length defaults to 21.
 ***/
$service_email='';
$minimum_password_length='';


/***
 * Path to user data storage
 ***/
$user_data_storage='';
$profile_picture_storage = $user_data_storage.'';

/***

 $baseurl=""; // define if other than the hosted URL
 
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