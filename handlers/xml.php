<?php
/*
 * Port of classic XML handlers. Move into a class for easy plugins.
 */

class Xml {

  public function updateTag($string,$tag,$newcontents)
  {
    $string = preg_replace( '/\s+/', ' ', $string ); // trim whitespace
    $pos=strpos($string,$tag);
    if($pos!==FALSE)
      {
        $bval=substr($string,0,$pos+strlen($tag));
        //$val=substr($string,$pos+strlen($tag));
        $ctag="</" . str_replace("<","",$tag);
        $eval=$string;
        $pos=strpos($eval,$ctag);
        while($pos!==false)
          {
            // keep trimming
            $eval=substr($eval,$pos+strlen($ctag));
            $pos=strpos($eval,$ctag);
          }
        return $bval . $newcontents . $ctag . $eval; // always the first one
      }
    else
      {
        // concatenate onto end
        $pos=strpos($string,"</xml>");
        if($pos===false) 
          {
            $pos=strlen($string);
            $cxml=null;
          }
        else $cxml="</xml>";
        $bval=substr($string,0,$pos);
        if(strpos($newcontents,$tag)!==false) $tag=null;
        else $ctag="</" . str_replace("<","",$tag);
        $new=$bval.$tag.$newcontents.$ctag.$cxml;
        return $new;
      }
  }

  public function getTagAttributes($string,$tag,$all=false)
  {
    // return [[attribute,value],[attribute,value],...] for all attributes in <$tag>
    $tag=str_replace("<","",$tag);
    $tag=str_replace(">","",$tag);
    $tag="<".$tag;
    $pos=strpos($string,$tag);
    if($pos!==false)
      {
        // found a valid tag
        // return all attribute values for a given tag
        $all_tags=explode($tag,$string);
        // it should never be the first iterator. Kill it.
        $all_tags=array_slice($all_tags,1);
        if($all) $parent_array=array();
        foreach($all_tags as $sstring)
          {
            $pos2=strpos($sstring,">");
            $sstring=substr($sstring,0,$pos2);
            if(empty($sstring) && !$all) return false; // this means that the tag has no attributes
            if(!empty($sstring))
              {
                $attributes=preg_split("/[\"'] +/",$sstring);
                // iterate through $attributes, and break each attribute pair into a subarray
                $result_array=array();
                foreach($attributes as $attribute)
                  {
                    $pair=explode("=",$attribute);
                    $i=0;
                    foreach($pair as $value) 
                      {
                        // remove leading or trailing quote
                        $value=str_replace('"',"",$value);
                        $value=str_replace("'","",$value);
                        $value=str_replace("&#39;","",$value);
                        $pair[$i]=trim($value);
                        $i++;
                      }
                    $result_array[]=$pair;
                  }
                if(!$all) return $result_array;
              }
            // This means $all has been declared
            // stuff into larger parent array
            if(empty($sstring)) $parent_array[]=false;
            else $parent_array[]=$result_array;
          }
        // take large parent array and return that
        return $parent_array;
      }
    return false;
  }

  public function getTagAttribute($string,$tag,$attribute)
  {
    $tag=str_replace("<","",$tag);
    $tag=str_replace(">","",$tag);
    $tag="<".$tag;
    $pos=strpos($string,$tag);
    if($pos!==false)
      {
        // Found at least one tag
        $all_tags=explode($tag,$string);
        foreach($all_tags as $sstring)
          {
            $pos2=strpos($sstring,">");
            $sstring=substr($sstring,0,$pos2);
            $attributes=preg_split("/[\"'] +/",$sstring);
            // Loop over all attributes
            foreach($attributes as $test)
              {
                $test=trim($test);
                if(strpos($test,$attribute)!==false)
                  {
                    // Potential attribute match
                    $pos3=strpos($test,"=");
                    if(substr($test,0,$pos3+1)==$attribute."=")
                      {
                        // Good value found
                        $value=substr($test,$pos3+2);
                        $quote=strpos($value,"'");
                        if($quote!==false) $value=substr($value,0,$quote);
                        return $value;
                      }
                    // keep looping if not found
                  }
              } // Attribute not found in list of attributes for this tag. 
          } // This tag instance fails. Repeat
        return false; // no results
      }
    else return false;

  }

  public function setTagAttribute($string,$tag,$attribute,$attvalue,$onematch=true,$retstring=true,$debug=false)
  {
    // For a given tag, set an attribute value.
    $matched=false;
    $retmatch=false;
    $tag=str_replace("<","",$tag);
    $tag=str_replace(">","",$tag);
    $tag="<".$tag;
    $pos=strpos($string,$tag);
    if($pos!==false)
      {
        // Found at least one tag
        $all_tags=explode($tag,$string);
        if($debug) { 
          echo "<!-- perseverate! ";
          print_r($all_tags);
          echo "-->";
        }
        foreach($all_tags as $sstring)
          {
            $pos2=strpos($sstring,">");
            // if index starts with < , it could be a surious set of tag matches .. .should be skipped
            if(substr($sstring,0,1)!="<" && !empty($sstring))
              {
                $ss_old=$sstring;
                $sstring=substr($sstring,0,$pos2); // text string of tag
                //#echo displayDebug("Extracted ".$sstring."\n");
                $attributes=preg_split("/[\"'] +/",$sstring); // match against truncated string
              }
            else $attributes=array(); // it'll skip the foreach loop
            // Loop over all attributes
            foreach($attributes as $test)
              {
                $test=trim($test);
                //#echo "Running against \"$test\" in tag...\n";
                if(strpos($test,$attribute)!==false && $matched===false)
                  {      
                    // Potential attribute match
                    $pos3=strpos($test,"=");
                    $matchstring=$attribute."=";
                    if(substr($test,0,$pos3+1)==$matchstring)
                      {
                        // Matching attribute found
                        //#echo displayDebug("Testing $test against $matchstring \n");
                        $value=substr($test,$pos3+2); // old attribute value
                        if($value==$attvalue) 
                          {
                            if($onematch) $matched=true; // so it won't find subsequent instances
                            $retmatch=true; // for the purposes of returning, a match was found
                          }
                        else
                          {
                            // stitch together a new tag
                            if($onematch) $matched=true; // so it won't find subsequent instances
                            $retmatch=true; // for the purposes of returning, a match was found
                            $newtag=trim($tag);
                            foreach($attributes as $el)
                              {
                                if(strpos($el,$matchstring)===false) 
                                  {
                                    if(substr($el,-1)=="'") $el=substr($el,0,-1);
                                    $newtag.=" ".$el."'";
                                    //#echo "Stiched on \"$el\" \n";
                                  }
                                else
                                  {
                                    // sanitize out the attribute value
                                    $elout=$matchstring."'".$attvalue."'";
                                    $newtag.=" ".$elout;
                                  }
                              }
                            // put the rest of the tag info on
                            $newtag=$newtag.substr($ss_old,$pos2);
                            //#echo "This is the tag: ".displayDebug($newtag). "\n\n";
                            break; // break out of the foreach loop
                          }
                      }
                    // keep looping if not found
                  }
                else if($matched===true) $sstring=trim($tag).$ss_old; // to properly fill in
              } // Attribute not found in list of attributes for this tag. 
            if(!empty($newtag)) $sstring=$newtag; // break the tag seach
            $newtag=""; // empty out new tag
            $new_buffer.=$sstring;
            //#echo "Current buffer: ".displayDebug($new_buffer)."\n\n";
          } // This tag instance fails. Repeat next tag
        //#echo "Finshed iterating over all_tags.\n";
        if(!$retmatch)
          {
            // no match, but there is a tag. Add the attribute.
            // start with $string, since no changes have been made.
            if($debug) echo "<!-- This is what we're checking -->";
            $i=0;
            // Re-find the tag, append to instances as specified.
            foreach($all_tags as $sstring)
              {
                $pos2=strpos($sstring,">");
                if(substr($sstring,0,1)!="<" && !empty($sstring))
                  {
                    // fix appending to first tag
                    //if($i=0) $i=1; // since the implode will throw the tag between [0] and [1]
                    $all_tags[$i]=" ".$attribute."='".$attvalue."'".$sstring;
                    if($debug) echo "<!-- Just set alltags element $i: .".$all_tags[$i]." -->";  
                    if($onematch) break;
                  }
                $i++;
              }
            if($debug) echo displayDebug(print_r($all_tags,true));
            $new_buffer=implode($tag,$all_tags);
          }
        if($retstring) return $new_buffer;
        else return true;
      }
    // If no tag matches at all, return a failure or the same string. Don't create a new tag.
    if($retstring) return $string; // no change
    else return false; // found no matching tags at all
  }


  public function getTagContents($string,$tag)
  {
    if(strpos($tag,"<")===FALSE) $tag .= "<";
    if(strpos($tag,">")===FALSE) $tag = $tag . ">";
    $pos=strpos($string,$tag);
    if($pos!==FALSE)
      {
        $val=substr($string,$pos+strlen($tag));
        $val=explode("</" . str_replace("<","",str_replace(">","",$tag)),$val);
        return $val[0]; // always the first one
      }
    else return FALSE;
  }

  
}

?>