<?php

/***********************************************************
 * SSAR Common names database API target
 *
 * API DESCRIPTION HERE
 *
 * API MODES HERE
 *
 *
 * Initial version by Philip Kahn
 * Started July 2014
 * https://github.com/tigerhawkvok/SSAR-species-database
 **********************************************************/

/*****************
 * Setup
 *****************/

require_once("CONFIG.php");
require_once(dirname(__FILE__)."/core/core.php");

$db = new DBHelper($default_database,$default_sql_user,$default_sql_password,$default_sql_url,$default_table,$db_cols);

if(isset($_SERVER['QUERY_STRING'])) parse_str($_SERVER['QUERY_STRING'],$_REQUEST);

$start_script_timer = microtime_float();

if(!function_exists('elapsed'))
  {
    function elapsed($start_time = null)
    {
      /***
       * Return the duration since the start time in
       * milliseconds.
       * If no start time is provided, it'll try to use the global
       * variable $start_script_timer
       *
       * @param float $start_time in unix epoch. See http://us1.php.net/microtime
       ***/

      if(!is_numeric($start_time))
        {
          global $start_script_timer;
          if(is_numeric($start_script_timer)) $start_time = $start_script_timer;
          else return false;
        }
      return 1000*(microtime_float() - (float)$start_time);
    }
  }

function returnAjax($data)
{
  if(!is_array($data)) $data=array($data);
  $data["execution_time"] = elapsed();
  header('Cache-Control: no-cache, must-revalidate');
  header('Expires: Mon, 26 Jul 1997 05:00:00 GMT');
  header('Content-type: application/json');
  print json_encode($data,JSON_FORCE_OBJECT);
  exit();
}

function checkColumnExists($column_list)
{
  if(empty($column_list)) return true;
  global $db;
  $cols = $db->getCols();
  foreach(explode(",",$column_list) as $column)
    {
      if(!array_key_exists($column,$cols))
        {
          returnAjax(array("status"=>false,"error"=>"Invalid column","human_error"=>"Sorry, you specified a lookup criterion that doesn't exist. Please try again.","columns"=>$column_list,"bad_column"=>$column));
        }
    }
  return true;
}

/*****************************
 * Setup flags
 *****************************/

$flag_fuzzy = boolstr($_REQUEST['fuzzy']);
$loose = boolstr($_REQUEST['loose']);
# Default limit is specified in CONFIG
$limit = is_numeric($_REQUEST['limit']) && $_REQUEST['limit'] >= 1 ? intval($_REQUEST['limit']):$default_limit;

checkColumnExists($_REQUEST['only']);
checkColumnExists($_REQUEST['include']);
checkColumnExists($_REQUEST['order']);

$order_by = isset($_REQUEST['order']) ? $_REQUEST['order']:"genus,species,subspecies";

$params = array();
$boolean_type = false;
if(isset($_REQUEST['filter']))
  {
    $params = smart_decode64($_REQUEST['filter']);
    if(empty($params))
      {
        $params_temp = json_decode($_REQUEST['filter'],true);
        if(!empty($params_temp))
          {
            $params = array();
            foreach($params_temp as $col=>$lookup)
              {
                $params[$db->sanitize(deEscape($col))] = $db->sanitize(deEscape($lookup));
              }
          }
      }
    if(!empty($params))
      {
        # Does the "BOOLEAN_TYPE" key exist?
        if(!array_key_exists("BOOLEAN_TYPE",$params)) returnAjax(array("status"=>false,"error"=>"Missing required parameter","human_error"=>"The key 'BOOLEAN_TYPE' must exist and be either 'AND' or 'OR'.","given"=>$params));
        # Is it valid?
        if($params['BOOLEAN_TYPE'] != "AND" || $params['BOOLEAN_TYPE'] != "OR") returnAjax(array("status"=>false,"error"=>"Missing required parameter","human_error"=>"The key 'BOOLEAN_TYPE' must exist and be either 'AND' or 'OR'.","given"=>$params));
        $boolean_type = $params['BOOLEAN_TYPE'];
        unset($params['BOOLEAN_TYPE']);
        # Do all the columns exist?
        foreach($params as $col=>$lookup)
          {
            checkColumnExists($col);
          }
      }
  }


$search = $db->sanitize(deEscape($_REQUEST['q']));



/*****************************
 * The actual handlers
 *****************************/

function areSimilar($string1,$string2,$distance=70,$depth=3)
{
  /*
   * Returns a TRUE if $string2 is similar to $string1,
   * FALSE otherwise.
   */
  # Is it a substring?
  $i=1;
  if(metaphone($string1) == metaphone($string2) && $i<=$depth ) return true;
  $i++;
  if(soundex($string1) == soundex($string2) && $i<=$depth) return true;
  $i++;
  $similar_difference = similar_text($string1,$string2,$percent);
  if($percent >= $distance && $i <=$depth) return true;
  $i++;
  $max_distance = strlen($string1)*($distance/100);
  if(levenshtein($string1,$string2) < $max_distance && $i<=$depth) return true;
  $i++;
  return false;
}

function handleParamSearch($filter_params,$loose = false,$boolean_type = "AND", $extra_params = false)
{
  /***
   * Handle the searches when they're using advanced options
   *
   * @param extra_params a literal query
   * @return array the result vector
   ***/
  $query = "SELECT * FROM `".$db->getTable()."` WHERE ";
  $where_arr = array();
  foreach($filter_params as $col=>$crit)
    {
      $where_arr[] = $loose ? "`".$col."` LIKE '%".$crit."%'":"`".$col."`='".$crit."'";
    }
  $where = "".implode(" ".strtoupper($boolean_type)." ",$where_arr)."";
  if(!empty($extra_params))
    {
      $where .= " AND (".$extra_params.")";
    }
  $where = "(".$where.")";
  $query .= $where;
  global $order_by;
  $ordering = explode(",",$order_by);
  $order = " ORDER BY "."`".implode("`,`",$ordering)."`";
  $query .= $order;
  $l = $db->openDB();
  $r = mysqli_query($l,$query);
  if($r === false)
    {
      returnAjax(array("status"=>false,"error"=>mysqli_error($l),"human_error"=>"There was an error executing this query"));
    }
  $result_vector = array();
  while($row = mysqli_fetch_assoc($r))
    {
      $result_vector[] = $row;
    }
  $result_vector["query"] = $query;
  return $result_vector;
}

/****
 * The actual main search loop
 ****/

$result_vector = array();
if(empty($params) || !empty($search))
  {
    # There was either a parsing failure, or no filter set.
    if(empty($search))
      {
        $search = "*"; # Wildcard it. Be greedy.
        $col = "species";
        $params[$col] = $search;
        $loose = true;
        $method = "full_simple_list";
        $l = $db->openDB();
        $query = "SELECT ".$order_by." FROM `".$db->getTable()."` ORDER BY ".$order_by;
        $r = mysqli_query($l,$query);
        try
          {
            while($row = mysqli_fetch_assoc($r))
              {
                $result_vector[] = $row;
              }
          }
        catch(Exception $e)
          {
            if(is_string($r)) $error = $r;
            else $error = $e;
          }
      }
    else if(is_numeric($search))
      {
        $method="year_search";
        $col = "authority_year";
        $loose = true; # Always true because of the way data is stored
        $params[$col] = $search;
        $r = $db->doQuery($params,"*",$boolean_type,$loose,true,$order_by);
        try
          {
            while($row = mysqli_fetch_assoc($r))
              {
                $result_vector[] = $row;
              }
          }
        catch(Exception $e)
          {
            if(is_string($r)) $error = $r;
            else $error = $e;
          }
      }
    else if (strpos(" ",$search) === false)
      {
        $method="spaceless_search";
        # No space in search
        if($boolean_type !== false)
          {
            # Handle the complicated statement. It'll need to be
            # escaped from normal handling.
            $extra_params = array();
            $extra_boolean_type = " OR ";
            if(!isset($_REQUEST['only']))
              {
                $extra_params["common_name"] = $search;
                $extra_params["genus"] = $search;
                $extra_params["species"] = $search;
                $extra_params["subspecies"] = $search;
                $extra_params["major_common_type"] = $search;
                $extra_params["major_subtype"] = $search;
                $extra_params["deprecated_scientific"] = $search;
              }
            else
              {
                foreach(explode(",",$_REQUEST['only']) as $column)
                  {
                    $extra_params[$db->sanitize($column)] = $search;
                  }
              }
            if(isset($_REQUEST['include']))
              {
                foreach(explode(",",$_REQUEST['include']) as $column)
                  {
                    $extra_params[$db->sanitize($column)] = $search;
                  }
              }
            $extra_filter = implode($extra_boolean_type,$extra_params);
            $result_vector = handleParamSearch($params,$loose,$boolean_type,$extra_filter);
          }
        else
          {
            $boolean_type = "OR";
            if(!isset($_REQUEST['only']))
              {
                $params["common_name"] = $search;
                $params["genus"] = $search;
                $params["species"] = $search;
                $params["subspecies"] = $search;
                $params["major_common_type"] = $search;
                $params["major_subtype"] = $search;
                $params["deprecated_scientific"] = $search;
              }
            else
              {
                foreach(explode(",",$_REQUEST['only']) as $column)
                  {
                    $params[$db->sanitize($column)] = $search;
                  }
              }
            if(isset($_REQUEST['include']))
              {
                foreach(explode(",",$_REQUEST['include']) as $column)
                  {
                    $params[$db->sanitize($column)] = $search;
                  }
              }
            if(!$flag_fuzzy)
              {
                $r = $db->doQuery($params,"*",$boolean_type,$loose,true,$order_by);
                try {
                  while($row = mysqli_fetch_assoc($r))
                    {
                      $result_vector[] = $row;
                    }
                }
                catch(Exception $e)
                  {
                    if(is_string($r)) $error = $r;
                    else $error = $e;
                  }
                # $result_vector["debug"] = $db->doQuery($params,"*",$boolean_type,$loose,true,$order_by,true);
              }
            else
              {
                foreach($params as $search_column=>$search_criteria)
                  {
                    $r = $db->doSoundex(array($search_column=>$search_criteria),"*",true,$order_by);
                    try
                      {
                        while($row = mysqli_fetch_assoc($r))
                          {
                            $result_vector[] = $row;
                          }
                      }
                    catch(Exception $e)
                      {
                        if(is_string($r)) $error = $r;
                        else $error = $e;
                      }
                  }
              }
          }
      }
    else
      {
        # Spaces in search
        ###############################
        ## Not convinced this makes sense here .... maybe only with
        ## common names?
        if(isset($_REQUEST['only']))
          {
            foreach(explode(",",$_REQUEST['only']) as $column)
              {
                $params[$db->sanitize($column)] = $search;
              }
          }
        if(isset($_REQUEST['include']))
          {
            foreach(explode(",",$_REQUEST['include']) as $column)
              {
                $params[$db->sanitize($column)] = $search;
              }
          }
        ###################################
        if($boolean_type !== false)
          {
            # Handle the complicated statement. It'll need to be
            # escaped from normal handling.
            $extra_params = array();
            $exp = explode(" ",$search);
            $fallback = true;
            $method = "scientific";
            if(sizeof($exp) == 2 || sizeof($exp) == 3)
              {
                $extra_boolean_type = " AND ";
                $extra_params["genus"] = $exp[0];
                $extra_params["species"] = $exp[1];
                if(sizeof($exp) == 3) $extra_params["subspecies"] = $exp[2];
                $where_arr = array();
                foreach($extra_params as $col=>$crit)
                  {
                    $where_arr[] = $loose ? "`".$col."` LIKE '%".$crit."%'":"`".$col."`='".$crit."'";
                  }
                $extra_filter = implode($extra_boolean_type,$where_arr);
              }
            $result_vector = handleParamSearch($params,$loose,$boolean_type,$extra_filter);
            if(sizeof($result_vector) == 0)
              {
                $result_vector = handleParamSearch($params,$loose,$boolean_type,"`deprecated_scientific` LIKE '%".$search."%'");
                $method = "deprecated_scientific";
                if(sizeof($result_vector) == 0)
                  {
                    $col = "common_name";
                    $extra_filter = $loose ? "`".$col."` LIKE '%".$search."%'":"`".$col."`='".$search."'";
                    $result_vector = handleParamSearch($params,$loose,$boolean_type,$extra_filter);
                  }
              }
          }
        else
          {
            $exp = explode(" ",$search);
            $fallback = true;
            if(sizeof($exp) == 2 || sizeof($exp) == 3)
              {
                $boolean_type = "and";
                $params["genus"] = $exp[0];
                $params["species"] = $exp[1];
                if(sizeof($exp) == 3) $params["subspecies"] = $exp[2];
                $r = $db->doQuery($params,"*",$boolean_type,$loose,true,$order_by);
                try
                  {
                    $method = "scientific";
                    $fallback = false;
                    if(mysqli_num_rows($r) > 0)
                      {
                        while($row = mysqli_fetch_assoc($r))
                          {
                            $result_vector[] = $row;
                          }
                      }
                    else
                      {
                        # Always has to be a loose query
                        $method = "deprecated_scientific";
                        $fallback = false;
                        $r = $db->doQuery(array("deprecated_scientific"=>$search),"*",$boolean_type,true,true,$order_by);
                        try
                          {
                            while($row = mysqli_fetch_assoc($r))
                              {
                                $result_vector[] = $row;
                              }
                          }
                        catch(Exception $e)
                          {
                            if(is_string($r)) $error = $r;
                            else $error = $e;
                          }
                      }
                  }
                catch(Exception $e)
                  {
                    if(is_string($r)) $error = $r;
                    else $error = $e;
                  }
              }
            if($fallback)
              {
                $method = "space_fallback";
                $params["common_name"] = $search;
                $r = $db->doQuery($params,"*",$boolean_type,$loose,true,$order_by);
                try
                  {
                    while($row = mysqli_fetch_assoc($r))
                      {
                        $result_vector[] = $row;
                      }
                  }
                catch(Exception $e)
                  {
                    if(is_string($r)) $error = $r;
                    else $error = $e;
                  }
              }
          }
      }
  }
else
  {
    $result_vector = handleParamSearch($params,$loose,$boolean_type);
  }
if(isset($error))
  {
    returnAjax(array("status"=>false,"error"=>$error,"human_error"=>"There was a problem performing this query. Please try again.","method"=>$method));
  }
else returnAjax(array("status"=>true,"result"=>$result_vector,"count"=>sizeof($result_vector),"method"=>$method,"query"=>$search,"params"=>$params,"query_params"=>array("bool"=>$boolean_type,"loose"=>$loose,"order_by"=>$order_by)));


?>