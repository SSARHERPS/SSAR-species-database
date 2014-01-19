<?php
/***
 * Core hooks to use for user management
 * Uses MySQLi as the main interface
 ***/
require_once(dirname(__FILE__).'/../CONFIG.php');
require_once(dirname(__FILE__).'/functions.inc');

function testDefaults() {
  global $default_user_table,$default_user_database;
  try
    {
      $l=openDB($default_user_database);
      if($l!==false)
        {
          if(mysqli_query($l,"SELECT * FROM `$default_user_table` LIMIT 1")===false)
            {
              if(createTable()) return true;
              else die("Table $default_user_table does not exist and could not be created");
            }
          else return true;
        }
      else die("Unable to connect to database");
    }
  catch(Exception $e)
    {
      die("An unexpected error occured -- the system reported '$e'");
    }
}

function createTable() {
  global $db_cols,$default_user_table,$default_user_database;
  $query="CREATE TABLE `$default_user_table` (id int(10) NOT NULL auto_increment";
  foreach($db_cols as $col=>$type) $query.=", $col $type";
  $query.=",PRIMARY KEY (id),UNIQUE id (id),KEY id_2 (id))";

  $l=openDB($default_user_database);
  $r=mysqli_query($l,$query);
  if($r!==false)
    {
      $query2="INSERT INTO `$default_user_table` VALUES()";
      $r2=mysqli_query($l,$query2);
    }
  return boolstr($r);
}

if(!function_exists('openDB'))
  {
    function openDB($test=false,$user=null,$password=null,$database=null)
    {
      global $default_user_database,$default_sql_user,$default_sql_password,$sql_url;
      if(!is_bool($test) && $database==null)
        {
          $database=$test;
          $test=false;
        }
      else if (!is_bool($test) && $database!=null) return false; // bad input
      if (empty($user)) $user=$default_sql_user;
      if (empty($password)) $password=$default_sql_password;
      if (empty($database)) $database=$default_user_database;
      if(!$test)
        {
          try
            {
              if($l=mysqli_connect($sql_url,$user,$password))
                {
                  if(mysqli_select_db($l,$database)) return $l;
                }
              else return false;
            }
          catch(Exception $e)
            {
              return false;
            }
        }
      else
        {
          return mysqli_connect($sql_url,$user,$password);
        }
    }
  }

if(!function_exists('execAndCloseDB'))
  {
    function execAndCloseDB($l,$query)
    {
      $result=mysqli_query($l,$query);
      mysqli_close($l);
      return $result;
    }
  }

if(!function_exists('getFirstRow'))
  {
    function getFirstRow($l,$query)
    {
      try
        {
          $result=mysqli_query($l,$query);
          if($result) $row=mysqli_fetch_assoc($result);
          else $row=false;
          return $row;
        }
      catch(Exception $e)
        {
          return false;
        }
    }
  }

if(!function_exists('sanitize'))
  {

    function cleanInput($input) 
    {
 
      $search = array(
        '@<script[^>]*?>.*?</script>@si',   // Strip out javascript
        '@<[\/\!]*?[^<>]*?>@si',            // Strip out HTML tags
        '@<style[^>]*?>.*?</style>@siU',    // Strip style tags properly
        '@<![\s\S]*?--[ \t\n\r]*>@'         // Strip multi-line comments
      );
 
      $output = preg_replace($search, '', $input);
      return $output;
    }

    function sanitize($input) 
    {
      if (is_array($input)) 
        {
          foreach($input as $var=>$val) 
            {
              $output[$var] = sanitize($val);
            }
        }
      else 
        {
          if (get_magic_quotes_gpc()) 
            {
              $input = stripslashes($input);
            }
          $input  = htmlentities(cleanInput($input));
          $input=str_replace("_","&#95;",$input); // Fix _ potential wildcard
          $input=str_replace("_","&#37;",$input); // Fix % potential wildcard
          $input=str_replace("'","&#39;",$input);
          $input=str_replace('"',"&#34;",$input);
          global $default_user_database;
          $l=openDB($default_user_database);
          $output = mysqli_real_escape_string($l,$input);
        }
      return $output;
    }
  }

if(!function_exists('is_entry'))
  {
    
    function is_entry($item,$field_name=null,$table_name=null,$database_name=null,$test=false)
    {
      global $default_user_table;
      if($field_name==null) $field_name = "id";
      if($table_name==null) $table_name = $default_user_table;
      $item=sanitize($item);
      $l=openDB($database_name);
      // Clean up the passed variable here
      $query="SELECT * FROM `$table_name` WHERE $field_name='$item'";
      try {
        $result=mysqli_query($l,$query);
        if($result===false) return false;
        $rows=mysqli_num_rows($result);
        mysqli_close($l);
        if($test) return $query;
        if($rows>0) return true;
        else return false;
      }
      catch(Exception $e) {
        return false;
      }
    }
  }

if(!function_exists('lookupItem'))
  {

    function lookupItem($item,$field_name=null,$table_name=null,$database_name=null,$closedb=false,$skipsan=false)
    {
      global $default_user_table;
      if(empty($field_name)) $field_name = "id";
      if(empty($table_name)) $table_name = $default_user_table;
      if(empty($database_name)) $database_name = $default_user_database;
      if($skipsan===false) 
        {
          $sitem=sanitize($item);
        }
      else 
        {
          // Only accept for emails -- run through email preg
          $preg="/[a-z0-9!#$%&'*+=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[A-Z]{2}|com|org|net|edu|gov|mil|biz|info|mobi|name|aero|asia|jobs|museum)\b/";
          if(preg_match($preg,$item)!=1) return false;
          $sitem=$item;
        }
      if($sitem==$item)
        {
          $l=openDB($database_name);
          $query="SELECT * FROM `$table_name` WHERE $field_name='$item'";
          $result=mysqli_query($l,$query);
          if($closedb)mysqli_close($l);
          if($result===false) return array(false,'error'=>mysqli_error($l));
          return $result;
        }
      return array(false,'error'=>"Injectable item code for '$item' vs. '$sitem'");
    }
  }

if(!function_exists('addItem'))
  {
    function addItem($field_arr,$value_arr,$table_name=null,$database_name=null,$test=false)
    {
      // make this transactional
      global $default_user_table,$default_user_database;
      if(empty($table_name)) $table_name = $default_user_table;
      if(empty($database_name)) $database_name=$default_user_database;
      $querystring = "INSERT INTO $table_name VALUES (";
      if(empty($value_arr))
        {
          $temp=array();
          foreach($field_arr as $k=>$v)
            {
              $value_arr[]=$k;
              $temp[]=$v;
            }
          $field_arr=$temp;
        }
      if(sizeof($field_arr)==sizeof($value_arr))
        {
          $i=0;
          $valstring="";
          $item=lookupItem('1',null,$table_name,$database_name);
          if($item!==false)
            {
              $source=mysqli_fetch_assoc($item);
            }
          // Create blank, correctly sized entry
          while ($i < sizeof($source))
            {
              $valstring.="''";
              if($i<sizeof($source)-1) $valstring .=",";
              $i++;
            }
          $querystring .= "$valstring)";
          if($test) $retval=$querystring;
          else 
            {
              $l=openDB($database_name);
              mysqli_query($l,'START TRANSACTION');
              if(mysqli_query($l,$querystring)===false)
                {
                  $r=mysqli_query($l,'ROLLBACK');
                  return array(false,"rollback_status"=>$r,"error"=>mysqli_error($l),"query"=>$querystring);
                }
            }
          $querystring = "UPDATE `$table_name` SET ";
          $i=0;
          $equatestring="";
          foreach($field_arr as $field)
            {
              if(!empty($field) && !empty($value_arr[$i]))
                {
                  $equatestring.="$field='" . $value_arr[$i] . "',";
                  $i++;
                }
              else $i++;
            }
          $equatestring=substr($equatestring,0,-1); // remove trailing comma
          $querystring .= "$equatestring WHERE id='" ;
          if($test) 
            {
              $row=getLastRowNumber($table_name,$database_name)+1;
              $querystring.= "$row'";
            }
          else $querystring.= mysqli_insert_id($l) . "'";
          if($test)
            {
              $retval.=" !!And!! ".$querystring;
              return $retval;
            }
          else
            {
              $res2=mysqli_query($l,$querystring);
              if($res2!==false) 
                {
                  mysqli_query($l,'COMMIT');
                  return true;
                }
              else 
                {
                  $r=mysqli_query($l,'ROLLBACK');
                  return array(false,"rollback_status"=>$r,"result"=>$res2,"error"=>mysqli_error($l),"query"=>$querystring);
                }
            }
        }
      else return false;
    }
  }

if(!function_exists('getLastRowNumber'))
  {
    function getLastRowNumber($table_name=null,$database_name=null)
    {
      // Return the highest id of the database. Thus, this includes deleted items.
      global $default_user_table, $database_name;
      if($table_name==null) $table_name = $default_user_table;
      $l=openDB($database_name);
      $query="SELECT * FROM `$table_name` ORDER BY id DESC LIMIT 1";
      $result=mysqli_query($l,$query);
      $rows = mysqli_fetch_row($result);
      return $rows[0];
    }
  }

if(!function_exists('returnTableContents'))
  {
    function returnTableContents($search_column,$search_criteria,$returned_fields_arr=null,$table_name=null,$database_name=null,$leave_open=true)
    {
      global $default_user_table,$default_user_database;
      if(empty($database_name)) $database_name=$default_user_database;
      if(empty($table_name)) $table_name = $default_user_table;
      $query="SELECT * FROM `$table_name`";
      if($search_criteria!='*') 
        {
          $search_criteria=trim(sanitize($search_criteria));
          $query .=" WHERE cast($search_column as char) like '%$search_criteria%'";
        }
      $l=openDB($database_name);
      $result= mysqli_query($l,$query);
      if($result!==false)
        {
          $count = mysqli_num_rows($result);
          if($returned_fields_arr==null) 
            {
              if(!$leave_open) mysqli_close($l);
              return $result;
            }
          else
            {
              if(is_array($returned_fields_arr)) $answer = array();
              while($results_arr=mysqli_fetch_assoc($result))
                {
                  if(is_array($returned_fields_arr))
                    {
                      foreach($returned_fields_arr as $key)
                        {
                          if(array_key_exists($key,$results_arr))
                            {
                              $answer[]=$results_arr[$key]; // return as a long array with item types repeating every N elements
                            }
                          else $answer[] = false;
                        }
                    }
                  else
                    {
                      if(array_key_exists($returned_fields_arr,$results_arr))
                        {
                          $answer = $results_arr[$returned_fields_arr];
                          return $answer;
                        }
                      else $answer=false;
                    }
                }
              if(!$leave_open) mysqli_close($l);
              return $answer;

            }
        }
      else return false;
    }
  }

if(!function_exists('updateEntry'))
  {
    function updateEntry($field,$value,$unq_id,$table_name=null,$database_name=null,$test=false,$preclean=false,$leaveopen=false,$opened=false,$made_transaction=false)
    {
      global $default_user_table;
      if($table_name==null) $table_name = $default_user_table;
      if(!is_array($unq_id)) return array(false,'Bad argument for variable unq_id');
      $column=$unq_id[0];
      $uval=$unq_id[1];  
      if(!is_entry($uval,$column,$table_name,$database_name)) return array(false,'query'=>is_entry($uval,$column,$table_name,$database_name,true));
      if(empty($value))
        {
          $temp=array();
          foreach($field as $k=>$v)
            {
              // should these be swapped?
              $value[]=$v;
              $temp[]=$k;
            }
          $field=$temp;
        }
      if(is_array($field) && is_array($value))
        {
          if(sizeof($field)==sizeof($value))
            {
              $i=0;
              foreach($field as $col)
                {
                  $l=openDB($database_name);
                  $d= $preclean ? mysqli_real_escape_string($l,$value[$i]):sanitize($value[$i]);
                  $col= $preclean ? mysqli_real_escape_string($l,$col):sanitize($col);
                  if($i>0) $setstate.=",";
                  $setstate.="`$col`=\"$d\"";
                  $i++;
                }
            }
          else return false;
        }
      else if ((is_array($field) && !is_array($value)) || (is_array($value) && !is_array($field))) return false;
      else 
        {
          $l=openDB($database_name);
          $value=$preclean ? mysqli_real_escape_string($l,$value):sanitize($value);
          $setstate="`$field`=\"$value\"";
        }
      $lr = !is_bool($opened) ? $opened:openDB($database_name);
      $query="UPDATE `$table_name` SET $setstate WHERE $column='$uval'";
      if(!$test)
        {
          if(!$made_transaction) mysqli_query($lr,'START TRANSACTION');
          $result=mysqli_query($lr,$query);
          if($result) 
            {
              mysqli_query($lr,'COMMIT');
              if(!$leaveopen) mysqli_close($lr);
              return true;
            }
          else 
            {
              $error=mysqli_error($lr)." for query \"$query\"";
              mysqli_query($lr,'ROLLBACK');
              if(!$leaveopen) mysqli_close($lr);
              return $error;
            }
        }
      else return $query;
    }
  }

if(!function_exists('deleteRow'))
  {

    function deleteRow($column,$criteria,$table=null,$database=null)
    {
      global $default_user_table;
      if($table==null) $table = $default_user_table;
      $criteria=sanitize($criteria);
      $column=sanitize($column);
      $l=openDB($database);
      mysqli_query($l,'START TRANSACTION');
      $query="DELETE FROM `$table` WHERE $column='$criteria'";
      if(mysqli_query($l,$query))
        {
          mysqli_query($l,'COMMIT');
          return array(true,"rows"=>mysqli_affected_rows($l));
        }
      else 
        {
          $r=mysqli_query($l,'ROLLBACK');
          return array(false,'rollback_status'=>$r,"error"=>mysqli_error($l),"query"=>$query);
        }
    }
  }
?>