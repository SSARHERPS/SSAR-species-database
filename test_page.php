<?php

/*
 * Sample page to show the whole kit n' kaboodle in action.
 */

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
         echo $big_login;
         ?>
    </article>
  </body>
</html>
