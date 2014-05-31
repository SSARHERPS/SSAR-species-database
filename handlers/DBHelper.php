<?php
/***
 * Core hooks to use for user management
 * Uses MySQLi as the main interface
 ***/

class DBHelper {
  require_once(dirname(__FILE__).'/functions.inc');

  public function __construct($database,$user,$pw,$url = "localhost",$table = null)
  {
    /***
     * @param string $database the database to connect to
     * @param string $user the username for the SQL database
     * @param string $pw the password for $user in $database
     * @param string $url the URL of the SQL server
     * @param string $table the default table
     ***/
    $this->db = $database;
    $this->user = $user;
    $this->pw = $pw;
    $this->url = $url;
    $this->table = $table;
  }

  public function getDB()
  {
    if(empty($this->db)) throw(new Exception("No database set."));
    return $this->db;
  }

  protected function setDB($db)
  {
    $this->db = $db;
  }

  public function getTable()
  {
    if(empty($this->table))
      {
        #empty chairs?
        throw(new Exception("No table has been defined for this object."));
      }
    return $this->table;
  }

  public function setTable($table)
  {
    $this->table = sanitize($table);
  }

  private function getUser()
  {
    if(empty($this->user))
      {
        throw(new Exception("No user has been defined for this object."));
      }
    return $this->user;
  }

  protected function setUser($user)
  {
    $this->user = $user;
  }

  private function getPW()
  {
    if(empty($this->pw))
      {
        throw(new Exception("No password has been defined for this object"));
      }
    return $this->pw;
  }

  protected function setPW($pw)
  {
    $this->pw = $pw;
  }

  private function getSQLURL()
  {
    if(empty($this->url)) $this->url = "localhost";
    return $this->url;
  }

  protected function setSQLURL($url)
  {
    $this->url = $url;
  }

  protected function setCols($cols)
  {
    if(!is_array($cols)) throw(new Exception("Invalid columns"));
    $shadow = array();
    foreach($cols as $col=>$type)
      {
        $col = $this->sanitize($col);
        $shadow[$col] = $type;
      }
    $this->cols = $shadow;
  }

  public function getCols()
  {
    if(!is_array($this->cols)) throw(new Exception("Invalid columns"));
    return $this->cols;
  }

  protected function testSettings($table = null)
  {
    $l=$this->openDB();
    if(!empty($table)) $this->setTable($table);
    if(mysqli_query($l,"SELECT * FROM `".$this->getTable()."` LIMIT 1")===false)
      {
        return createTable();
      }
    return true;
  }

  private function createTable()
  {
    /***
     * @return bool
     ***/
    $query="CREATE TABLE `".$this->getTable()."` (id int(10) NOT NULL auto_increment";
    foreach($this->getCols() as $col=>$type)
      {
        $query.=", ".$this->sanitize($col)." ".$type;
      }
    $query.=",PRIMARY KEY (id),UNIQUE id (id),KEY id_2 (id))";

    $l=$this->openDB();
    $r=mysqli_query($l,$query);
    if($r!==false)
      {
        $query2="INSERT INTO `".$this->getTable()."` VALUES()";
        $r2=mysqli_query($l,$query2);
      }
    return $r && $r2;
  }

  private static function cleanInput($input)
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

  protected function sanitize($input)
  {
    # Emails get mutilated here -- let's check that first
    $preg="/[a-z0-9!#$%&'*+=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+(?:[a-z]{2}|com|org|net|edu|gov|mil|biz|info|mobi|name|aero|asia|jobs|museum)\b/";
    if(preg_match($preg,$input) === 1)
      {
        # It's an email, let's escape it and be done with it
        $l=$this->openDB();
        $output = mysqli_real_escape_string($l,$input);
        return $output;
      }
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
        $input  = htmlentities(self::cleanInput($input));
        $input=str_replace("_","&#95;",$input); // Fix _ potential wildcard
        $input=str_replace("_","&#37;",$input); // Fix % potential wildcard
        $input=str_replace("'","&#39;",$input);
        $input=str_replace('"',"&#34;",$input);
        $l=$this->openDB();
        $output = mysqli_real_escape_string($l,$input);
      }
    return $output;
  }


  public function openDB()
  {
    /***
     * @return mysqli_resource
     ***/
    if($l=mysqli_connect($this->getSQLURL(),$this->getUser(),$this->getPW()))
      {
        if(mysqli_select_db($l,$this->getDB())) return $l;
      }
    throw(new Exception("Could not connect to database."));
  }

  public function getFirstRow($query)
  {
    $l = $this->openDB();
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


  public function is_entry($item,$field_name=null,$precleaned=false,$test=false)
  {
    if($field_name==null) $field_name = "id";
    if($precleaned!==true)
      {
        $item = $this->sanitize($item);
        $field_name = $this->sanitize($field_name);
      }
    $l=$this->openDB();
    $query="SELECT * FROM `".$this->getTable()."` WHERE `field_name`='$item'";
    try {
      $result=mysqli_query($l,$query);
      if($result===false) return false;
      $row=mysqli_fetch_row($result);
      mysqli_close($l);
      if($test) return array('query'=>$query,'row'=>$row);
      if(!empty($row[0])) return true;
      else return false;
    }
    catch(Exception $e) {
      return false;
    }
  }


  public function lookupItem($item,$field_name=null,$throw=false,$precleaned=false)
  {
    if(empty($field_name)) $field_name = "id";
    if($precleaned!==true)
      {
        $item = $this->sanitize($item);
        $field_name = $this->sanitize($field_name);
      }

    $l=$this->openDB();
    $query="SELECT * FROM `".$this->getTable()."` WHERE `$field_name`='$item'";
    $result=mysqli_query($l,$query);
    if($result===false && $throw===true) throw(new Exception("MySQL error - ".mysqli_error($l)));
    return $result;
  }


  public function getLastRowNumber()
  {
    /***
     * Return the highest id of the database. Thus, this includes deleted items.
     *
     * @return int
     ***/
    $l=$this->openDB();
    $query="SELECT * FROM `".$this->getTable()."` ORDER BY id DESC LIMIT 1";
    $result=mysqli_query($l,$query);
    $rows = mysqli_fetch_row($result);
    return $rows[0];
  }

  public function deleteRow($value,$field_name,$throw=false)
  {
    /***
     * Deletes a row
     *
     * @param string $value match for $field_name = $value
     * @param string $field_name column name
     * @return array with result in "status"; if true, rows affected in "rows"; if false, error in "error"
     ***/
    $value=$this->sanitize($value);
    $field_name=$this->sanitize($field_name);
    $l=$this->openDB();
    mysqli_query($l,'BEGIN');
    $query="DELETE FROM `".$this->getTable()."` WHERE `$field_name`='$value'";
    if(mysqli_query($l,$query))
      {
        mysqli_query($l,'COMMIT');
        return array("status"=>true,"rows"=>mysqli_affected_rows($l));
      }
    else
      {
        $r=mysqli_query($l,'ROLLBACK');
        if($throw === true) throw(new Exception("Failed to delete row."));
        return array("status"=>false,'rollback_status'=>$r,"error"=>mysqli_error($l));
      }
  }

  public function addItem($value_arr,$field_arr = null,$test=false)
  {
    /***
     *
     * @param array $value_arr
     * @param array $field_arr
     ***/
    $querystring = "INSERT INTO `".$this->getTable()."` VALUES (";
    if(empty($field_arr))
      {
        $temp=array();
        foreach($value_arr as $k=>$v)
          {
            $field_arr[]=$k;
            $temp[]=$v;
          }
        $value_arr=$temp;
      }
    if(sizeof($field_arr)==sizeof($value_arr))
      {
        $i=0;
        $valstring="";
        $item=$this->lookupItem('1',null,$table_name,$database_name);
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
            $l=$this->openDB();
            mysqli_query($l,'BEGIN');
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
            $row=$this->getLastRowNumber()+1;
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

######### Left off here -- need to update arg orders for delete and updateentry, clean updateentry
  function updateEntry($value,$field_name,$unq_id,$precleaned=false)
  {
    /***
     *
     * @param string $value new value to fill $field_name
     * @param string $field_name column to be updated
     * @param array $unq_id a 1-element array of col=>val to designate the matching criteria
     * @param bool $precleaned if the input elements have been presanitized
     ***/
    if(!is_array($unq_id))
      {
        throw(new Exception("Invalid argument for unq_id"));
      }
    $column=key($unq_id);
    $uval=current($unq_id);
    if(!is_entry($uval,$column,$precleaned)) return array(false,'query'=>is_entry($uval,$column,$table_name,$database_name,true));
    if(empty($value))
      {
        $temp=array();
        foreach($field_name as $k=>$v)
          {
            // should these be swapped?
            $value[]=$v;
            $temp[]=$k;
          }
        $field_name=$temp;
      }
    if(is_array($field_name) && is_array($value))
      {
        if(sizeof($field_name)==sizeof($value))
          {
            $i=0;
            foreach($field_name as $col)
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
    else if ((is_array($field_name) && !is_array($value)) || (is_array($value) && !is_array($field_name))) return false;
    else
      {
        $l=openDB($database_name);
        $value=$preclean ? mysqli_real_escape_string($l,$value):sanitize($value);
        $setstate="`$field_name`=\"$value\"";
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

if(!function_exists('addItem'))
  {

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

}

?>