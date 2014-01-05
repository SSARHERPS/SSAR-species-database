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

function createKey($password,$salt=null,$add_salts=null)
{
  $cryptastic=new cryptastic;
  if(empty($salt)) $salt=createSalt(32,$add_salts);
  $key=$cryptastic->pbkdf2($password,$salt,25000,32);
  // Save this key -- it is unique and can't be regenerated
  return array($key,$salt);
}

//--------------------------------
class cryptastic {

	/** Encryption Procedure
	 *
	 *	@param   mixed    msg      message/data
	 *	@param   string   k        encryption key
	 *	@param   boolean  base64   base64 encode result
	 *
	 *	@return  string   iv+ciphertext+mac or
	 *           boolean  false on error
   */
	public function encrypt( $msg, $k, $base64 = false ) {

		// open cipher module (do not change cipher/mode)
		if ( ! $td = mcrypt_module_open('rijndael-256', '', 'ctr', '') )
			return false;

		$msg = serialize($msg);							// serialize
		$iv  = mcrypt_create_iv(32, MCRYPT_RAND);		// create iv

		if ( mcrypt_generic_init($td, $k, $iv) !== 0 )	// initialize buffers
			return false;

		$msg  = mcrypt_generic($td, $msg);				// encrypt
		$msg  = $iv . $msg;								// prepend iv
		$mac  = $this->pbkdf2($msg, $k, 1000, 32);		// create mac
		$msg .= $mac;									// append mac

		mcrypt_generic_deinit($td);						// clear buffers
		mcrypt_module_close($td);						// close cipher module

		if ( $base64 ) $msg = base64_encode($msg);		// base64 encode?

		return $msg;									// return iv+ciphertext+mac
	}

	/** Decryption Procedure
	 *
	 *	@param   string   msg      output from encrypt()
	 *	@param   string   k        encryption key
	 *	@param   boolean  base64   base64 decode msg
	 *
	 *	@return  string   original message/data or
	 *           boolean  false on error
   */
	public function decrypt( $msg, $k, $base64 = false ) {

		if ( $base64 ) $msg = base64_decode($msg);			// base64 decode?

		// open cipher module (do not change cipher/mode)
		if ( ! $td = mcrypt_module_open('rijndael-256', '', 'ctr', '') )
			return false;

		$iv  = substr($msg, 0, 32);							// extract iv
		$mo  = strlen($msg) - 32;							// mac offset
		$em  = substr($msg, $mo);							// extract mac
		$msg = substr($msg, 32, strlen($msg)-64);			// extract ciphertext
		$mac = $this->pbkdf2($iv . $msg, $k, 1000, 32);		// create mac

		if ( $em !== $mac )									// authenticate mac
			return false;

		if ( mcrypt_generic_init($td, $k, $iv) !== 0 )		// initialize buffers
			return false;

		$msg = mdecrypt_generic($td, $msg);					// decrypt
		$msg = unserialize($msg);							// unserialize

		mcrypt_generic_deinit($td);							// clear buffers
		mcrypt_module_close($td);							// close cipher module

		return $msg;										// return original msg
	}

	/** PBKDF2 Implementation (as described in RFC 2898);
	 *
	 *	@param   string  p   password
	 *	@param   string  s   salt
	 *	@param   int     c   iteration count (use 1000 or higher)
	 *	@param   int     kl  derived key length
	 *	@param   string  a   hash algorithm
	 *
	 *	@return  string  derived key
   */
	public function pbkdf2( $p, $s, $c, $kl, $a = 'sha256' ) {

		$hl = strlen(hash($a, null, true));	// Hash length
		$kb = ceil($kl / $hl);				// Key blocks to compute
		$dk = '';							// Derived key

		// Create key
		for ( $block = 1; $block <= $kb; $block ++ ) {

			// Initial hash for this block
			$ib = $b = hash_hmac($a, $s . pack('N', $block), $p, true);

			// Perform block iterations
			for ( $i = 1; $i < $c; $i ++ ) 

				// XOR each iterate
				$ib ^= ($b = hash_hmac($a, $b, $p, true));

			$dk .= $ib; // Append iterated block
		}

		// Return derived key of correct length
		return substr($dk, 0, $kl);
	}
}

?>