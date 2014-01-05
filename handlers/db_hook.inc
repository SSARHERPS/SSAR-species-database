<?php
/***
    Simple DB hooks for a single database site.
***/
$default_table='validusers';
$default_database="mysql_test_reallyactivepeople";
$default_user="tzi25l7a3t_activ";
$default_password="90Sj!kog0HhJK59E&r";


function openDB($test=false,$user=null,$password=null,$database=null)
{
  global $default_database,$default_user,$default_password;
  if(!is_bool($test) && $database==null)
    {
      $database=$test;
      $test=false;
    }
  else if (!is_bool($test) && $database!=null) return false; // bad input
  if ($user==null) $user=$default_user;
  if ($password==null) $password=$default_password;
  if ($database==null) $database=$default_database;
  if(!$test)
    {
      if($l=@mysqli_connect('mysql.test.reallyactivepeople.com',$user,$password))
        {
          if(mysqli_select_db($l,$database)) return $l;
        }
      else return false;
    }
  else
    {
      return @mysqli_connect('mysql.test.reallyactivepeople.com',$user,$password);
    }
}

function execAndCloseDB($l,$query)
{
  $result=mysqli_query($l,$query);
  mysqli_close($l);
  return $result;
}

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
      $l=openDB();
      $output = mysqli_real_escape_string($l,$input);
    }
  return $output;
}

function is_entry($item,$field_name=null,$table_name=null,$database_name=null,$test=false)
{
  global $default_table;
  if($field_name==null) $field_name = "id";
  if($table_name==null) $table_name = $default_table;
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

function lookupItem($item,$field_name=null,$table_name=null,$database_name=null,$closedb=false,$skipsan=false)
{
  global $default_table;
  if($field_name==null) $field_name = "id";
  if($table_name==null) $table_name = $default_table;
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
      if($result===false) return array(false,mysqli_error($l));
      return $result;
    }
  else return false;
}

function decrementItemQuantity($item,$lookup_name=null,$field_name=null,$table_name=null,$database_name=null)
{
  /***
      Note: Only works with numeric item identifiers
  ***/
  global $default_table;
  if($field_name==null) $field_name = "quantity";
  if($table_name==null) $table_name = $default_table;
  $result = lookupItem($item,$lookup_name,$table_name,$database_name,false);
  if($result!==false)
    {
      $quant = mysqli_fetch_assoc($result);
      $quant=intval($quant[$field_name]);
      $quant--;
      if($quant<0)
        {
          return false;
        }
      $l=openDB();
      $query = "UPDATE $table_name SET $field_name='$quant' WHERE id='$item'";
      mysqli_query($l,'START TRANSACTION');
      if(mysqli_query($l,$query))
        {
          mysqli_query($l,'COMMIT');
          return true;
        }
      else 
        {
          mysqli_query($l,'ROLLBACK');
          return false;
        }
    }
  else
    {
      return false;
    }
}

function addItem($field_arr,$value_arr,$table_name=null,$database_name=null,$test=false)
{
  // make this transactional
  global $default_table;
  if($table_name==null) $table_name = $default_table;
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

function getLastRowNumber($table_name=null,$database_name=null)
{
  // Return the highest id of the database. Thus, this includes deleted items.
  global $default_table, $database_name;
  if($table_name==null) $table_name = $default_table;
  $l=openDB($database_name);
  $query="SELECT * FROM `$table_name` ORDER BY id DESC LIMIT 1";
  $result=mysqli_query($l,$query);
  $rows = mysqli_fetch_row($result);
  return $rows[0];
}

function returnTableContents($search_column,$search_criteria,$returned_fields_arr=null,$table_name=null,$database_name=null,$leave_open=true)
{
  global $default_table,$database_name;
  if($table_name==null) $table_name = $default_table;
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
              // used to be here
            }
          if(!$leave_open) mysqli_close($l);
          return $answer;

        }
    }
  else return false;
}


function updateEntry($field,$value,$unq_id,$table_name=null,$database_name=null,$test=false,$preclean=false,$leaveopen=false,$opened=false,$made_transaction=false)
{
  global $default_table;
  if($table_name==null) $table_name = $default_table;
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


function getDistance($slat,$slng,$dist,$restrict=null,$unit='km',$lbound=0,$hbound=20,$narrow=false,$table_name=null,$database_name=null,$test=false)
{
  // Requires GPS address. Use geocodeZip() in functions.inc
  // Based on http://goo.gl/XDFhm
  // Restrictions of form [column,search string,table]
  global $default_table;
  if($table_name==null) $table_name = $default_table;
  if($unit=='mi') $const=3959;
  else $const=6371;
  $query="SELECT id, ( $const * acos( cos( radians($slat) ) * cos( radians( lat ) ) * cos( radians( lng ) - radians($slng) ) + sin( radians($slat) ) * sin( radians( lat ) ) ) ) AS distance FROM `$table_name` HAVING distance < $dist ORDER BY distance LIMIT $lbound , $hbound;";
  if(!empty($restrict))
    {
      $column='dblink';
      $table2=$default_table;
      if(is_array($restrict))
        {
          $column=$restrict[0];
          $choice=$restrict[1];
          if(!empty($restrict[2])) $table2=$restrict[2];
        }
      else $choice=$restrict;
      $qmod="SELECT id FROM `$table2` WHERE $column";
      if(!$narrow)
        {
          if(is_array($choice))
            {
              $build=$choice;
              $i=0;
              foreach($choice as $activity)
                {
                  if($i==0) $append='';
                  else $append="%' OR $column LIKE '%";
                  $constring.=$append.$activity;
                  $i++;
                }
              $choice=$constring;
            }
          $qmod.=" LIKE '%$choice%' ";
        }
      else $qmod.="='$choice' ";
      $pos=strpos($query," ORDER BY");
      $qbeg=substr($query,0,$pos);
      $qend=substr($query,$pos);
      //$query=$qmod." AND id IN (".$qbeg.")".$qend;
      $query=$qbeg." AND id IN (".$qmod.")".$qend;
    }
  if($test) return $query;
  $l=openDB($database_name);
  $res=@mysqli_query($l,$query);
  if (!$res) return array(false,mysqli_error($l));
  else
    {
      $retarr=array();
      while($row=@mysqli_fetch_assoc($res))
        {
          $retarr[]=$row;
        }
      return $retarr;
    }
  
}
function deleteRow($column,$criteria,$table=null,$database=null) {
  global $default_table;
  if($table==null) $table = $default_table;
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
?>
