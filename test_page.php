<?php
   ob_start( 'ob_gzhandler' ); // handles headers
/*
 * Sample page to show the whole kit n' kaboodle in action.
 */
if($_REQUEST['t']=='hash')
  {
    // decode the JSON
    require_once('handlers/db_hook.inc');
    $l=openDB();
    $r=mysqli_query($l,"SELECT password FROM `userdata` WHERE username='".sanitize($_POST['user'])."'");
    $hba=mysqli_fetch_array($r);
    $hb=$hba[0];
    $a=json_decode($hb,true);
    print_r($a);
    require_once('stronghash/php-stronghash.php');
    require_once('handlers/login_functions.php');
    $h=new Stronghash();
    $u=new UserFunctions();
    // user validation
    echo "<pre> LookupUser results -- ";
    print_r($u->lookupUser($_POST['user'],$_POST['pw_base'],true));
    echo "\n VerifyHash results --";
    print_r($h->verifyHash($_POST['pw_base'],$a,null,null,null,true));
    echo "</pre>";
  }
   

?>

<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en">
  <head>
    <title>Sample Page for Userhandler</title>
  </head>
  <body>
    <article>
      <?php
         require_once('login.php');
         ?>
      <div>
        <h3>Test Hash</h3>
        <p>You can check to ensure the proper functioning of the hashing here. Please note these passwords in the next field are plaintext.</p>
        <form action='?t=hash' method='post'>
          <input type='email' name='user' placeholder='username'/><br/>
          <input type='text' name='pw_base' placeholder='pass'/><br/>
          <input type='submit'/>
        </form>
      </div>
    </article>
  </body>
</html>
