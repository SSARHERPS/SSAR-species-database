<?php
/*
 * Handle encryption. As of 2014.01.04, this need heavy checking, is probably broken
 */



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

?>