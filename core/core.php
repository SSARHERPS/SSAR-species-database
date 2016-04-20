<?php

if(!function_exists('microtime_float'))
  {
    function microtime_float()
    {
      if(version_compare(phpversion(), '5.0.0', '<'))
        {
          list($usec, $sec) = explode(" ", microtime());
          return ((float)$usec + (float)$sec);
        }
      else
        {
          return microtime(true);
        }
    }
  }

if(!function_exists('dirListPHP'))
  {
    function dirListPHP ($directory,$filter=null,$extension=false,$debug=false)
    {
      $results = array();
      $handler = @opendir($directory);
      if($handler===false) return false;
      while ($file = readdir($handler))
        {
          if ($file != '.' && $file != '..' )
            {
              if($filter!=null)
                {
                  if($extension!==false)
                    {
                      $parts=explode(".",basename($file));
                      $size=sizeof($parts);
                      $ext_file=array_pop($parts);
                      $filename=implode(".",$parts);
                      if($debug) echo "Looking at extension '$extension' and '$ext_file' for $file and $filename\n";
                      if($ext_file==$extension)
                        {
                          if(empty($filter)) $results[]=$file;
                          else if(strpos(strtolower($filename),strtolower($filter))!==false) $results[]=$file;
                        }
                    }
                  else if(strpos(strtolower($file),strtolower($filter))!==false)
                    {
                      $results[]=$file;
                      if($debug) echo "No extension used\n";
                    }
                }
              else
                {
                  $results[] = $file;
                  if($debug) echo "No filter used \n";
                }
            }
        }
      closedir($handler);
      return $results;
    }
  }


if(!function_exists('encode64'))
  {
    function encode64($data) { return base64_encode($data); }
    function decode64($data)
    {
      # This is STRICT decoding
        # Fix a bunch of random problems that can happen with PHP
        $enc = strtr($data, '-_', '+/');
        $enc = chunk_split(preg_replace('!\015\012|\015|\012!','',$enc));
        $enc = str_replace(' ','+',$enc);
        #$enc = urldecode($enc);
      if(@base64_encode(@base64_decode($enc,true))==$enc) return urldecode(@base64_decode($data));
      return false;
    }
  }


if(!function_exists('strbool'))
  {
    function strbool($bool)
    {
      // returns the string of a boolean as 'true' or 'false'.
      if(is_string($bool)) $bool=boolstr($bool); // if a string is passed, convert it to a bool
      if(is_bool($bool)) return $bool ? 'true' : 'false';
      else return 'non_bool';
    }
    function boolstr($string)
    {
      // returns the boolean of a string 'true' or 'false'
      if(is_bool($string)) return $string;
      if(is_string($string))
      {
        if(preg_match("/[0-1]/",$string)) return intval($string) == 1 ? true:false;
        return strtolower($string)==='true' ? true:false;
      }
      if(preg_match("/[0-1]/",$string)) return $string == 1 ? true:false;
      return false;
    }
  }

if(!function_exists("do_post_request"))
  {
    function do_post_request($url, $data, $optional_headers = null)
    {
      /***
       * Do a POST request
       *
       * @param string $url the destination URL
       * @param array $data The paramter as key/value pairs
       * @return response object
       ***/

      $params = array('http' => array(
        'method' => 'POST',
        'content' => http_build_query($data)
      ));
      if ($optional_headers !== null) {
        $params['http']['header'] = $optional_headers;
      }
      $ctx = stream_context_create($params);
      # If url handlers are set,t his whole next part can be file_get_contents($url,false,$ctx)
      $fp = @fopen($url, 'rb', false, $ctx);
      if (!$fp) {
        throw new Exception("Problem with $url, $php_errormsg");
      }
      $response = @stream_get_contents($fp);
      if ($response === false) {
        throw new Exception("Problem reading data from $url, $php_errormsg");
      }
      return $response;
    }
  }

if(!function_exists('deEscape'))
  {
    function deEscape($input) {
      return htmlspecialchars_decode(html_entity_decode(urldecode($input)));
    }
  }


class ImageFunctions {

    public function __construct($imgUrl = null)
    {
        $this -> img = $imgUrl;
    }

    private static function notfound() {
        throw new Exception("Not Found Exception");
    }

    public static function randomRotate($min,$max) {
        $angle=rand($min,$max);
        if(rand(0,100)%2)$angle="-".$angle;
        return "transform:rotate(".$angle."deg);-moz-transform:rotate(".$angle."deg);-webkit-transform:rotate(".$angle."deg);";
    }


    public static function randomImage($dir = "assets/images") {
        $images=dirListPHP($dir,'.jpg');
        if($images===false) return false;
        $item=rand(0,count($images)-1);
        return $dir . '/' . $images[$item];
    }

    public static function staticResizeImage($imgfile,$output,$max_width=NULL,$max_height=NULL)
    {
        if(!is_numeric($max_height)) $max_height=1000;
        if(!is_numeric($max_width)) $max_width=2000;
        if (function_exists(get_magic_quotes_gpc) && get_magic_quotes_gpc())
        {
            $image = stripslashes( $imgfile );
        }
        else  $image = $imgfile;

        if (strrchr($image, '/')) {
            $filename = substr(strrchr($image, '/'), 1); // remove folder references
        }
        else {
            $filename = $image;
        }

        if(!file_exists($image)) return array("status"=>false,"error"=>"File does not exist","image_path"=>$image);

        $size = getimagesize($image);
        $width = $size[0];
        $height = $size[1];
        if($width == 0 ) return array("status"=>false, "error"=>"Unable to compute image dimensions");
        // get the ratio needed
        $x_ratio = $max_width / $width;
        $y_ratio = $max_height / $height;

        // if image already meets criteria, load current values in
        // if not, use ratios to load new size info
        if (($width <= $max_width) && ($height <= $max_height) ) {
            $tn_width = $width;
            $tn_height = $height;
        } else if (($x_ratio * $height) < $max_height) {
            $tn_height = ceil($x_ratio * $height);
            $tn_width = $max_width;
        } else {
            $tn_width = ceil($y_ratio * $width);
            $tn_height = $max_height;
        }

        /* Caching additions by Trent Davies */
        // first check cache
        // cache must be world-readable
        $resized = 'cache/'.$tn_width.'x'.$tn_height.'-'.$filename;
        $imageModified = @filemtime($image);
        $thumbModified = @filemtime($resized);


        // read image
        $ext = strtolower(substr(strrchr($image, '.'), 1)); // get the file extension
        switch ($ext) {
        case 'jpg':     // jpg
            $src = imagecreatefromjpeg($image) or self::notfound();
            break;
        case 'png':     // png
            $src = imagecreatefrompng($image) or self::notfound();
            break;
        case 'gif':     // gif
            $src = imagecreatefromgif($image) or self::notfound();
            break;
        case 'bmp':     // bmp
            $src = imagecreatefromwbmp($image) or self::notfound();
            break;
        case 'webp':     // webp
            $src = imagecreatefromwebp($image) or self::notfound();
            break;
        default:
            self::notfound();
        }

        // set up canvas
        $dst = imagecreatetruecolor($tn_width,$tn_height);

        imageantialias ($dst, true);

        // copy resized image to new canvas
        imagecopyresampled ($dst, $src, 0, 0, 0, 0, $tn_width, $tn_height, $width, $height);

        /* Sharpening adddition by Mike Harding */
        // sharpen the image (only available in PHP5.1)
        /*if (function_exists("imageconvolution")) {
          $matrix = array(    array( -1, -1, -1 ),
          array( -1, 32, -1 ),
          array( -1, -1, -1 ) );
          $divisor = 24;
          $offset = 0;

          imageconvolution($dst, $matrix, $divisor, $offset);
          }*/

        // send the header and new image
        if($ext=='jpg')
        {
            $status = imagejpeg($dst, $output, 75);
        }
        else if ($ext=='png')
        {
            $status = imagepng($dst, $output, 9);
        }
        else if ($ext=='gif')
        {
            $status = imagegif($dst, $output);
        }
        else if ($ext == "bmp")
        {
            $status = imagewbmp($dst, $output);
        }
        else if ($ext == "webp")
        {
            $status = imagewebp($dst, $output);
        }
        else
        {
            return array("status"=>false,"error"=>"Illegal extension","extension"=>$ext);
        }

        // clear out the resources
        imagedestroy($src);
        imagedestroy($dst);
        return array("status"=>$status, "output"=>$output, "output_size"=>"$tn_width X $tn_height");
    }

    public function resizeImage($output,$max_width=NULL,$max_height=NULL)
    {
        if(!is_numeric($max_height)) $max_height=1000;
        if(!is_numeric($max_width)) $max_width=2000;
        if (function_exists(get_magic_quotes_gpc) && get_magic_quotes_gpc())
        {
            $image = stripslashes( $this->img );
        }
        else  $image = $this->img;

        if (strrchr($image, '/')) {
            $filename = substr(strrchr($image, '/'), 1); // remove folder references
        }
        else {
            $filename = $image;
        }

        if(!file_exists($image)) return array("status"=>false,"error"=>"File does not exist","image_path"=>$image);

        $size = getimagesize($image);
        $width = $size[0];
        $height = $size[1];
        if($width == 0 ) return array("status"=>false, "error"=>"Unable to compute image dimensions");
        // get the ratio needed
        $x_ratio = $max_width / $width;
        $y_ratio = $max_height / $height;

        // if image already meets criteria, load current values in
        // if not, use ratios to load new size info
        if (($width <= $max_width) && ($height <= $max_height) ) {
            $tn_width = $width;
            $tn_height = $height;
        } else if (($x_ratio * $height) < $max_height) {
            $tn_height = ceil($x_ratio * $height);
            $tn_width = $max_width;
        } else {
            $tn_width = ceil($y_ratio * $width);
            $tn_height = $max_height;
        }

        /* Caching additions by Trent Davies */
        // first check cache
        // cache must be world-readable
        $resized = 'cache/'.$tn_width.'x'.$tn_height.'-'.$filename;
        $imageModified = @filemtime($image);
        $thumbModified = @filemtime($resized);


        // read image
        $ext = strtolower(substr(strrchr($image, '.'), 1)); // get the file extension
        switch ($ext) {
        case 'jpg':     // jpg
            $src = imagecreatefromjpeg($image) or self::notfound();
            break;
        case 'png':     // png
            $src = imagecreatefrompng($image) or self::notfound();
            break;
        case 'gif':     // gif
            $src = imagecreatefromgif($image) or self::notfound();
            break;
        case 'bmp':     // bmp
            $src = imagecreatefromwbmp($image) or self::notfound();
            break;
        case 'webp':     // webp
            $src = imagecreatefromwebp($image) or self::notfound();
            break;
        default:
            self::notfound();
        }

        // set up canvas
        $dst = imagecreatetruecolor($tn_width,$tn_height);

        imageantialias ($dst, true);

        // copy resized image to new canvas
        imagecopyresampled ($dst, $src, 0, 0, 0, 0, $tn_width, $tn_height, $width, $height);

        /* Sharpening adddition by Mike Harding */
        // sharpen the image (only available in PHP5.1)
        /*if (function_exists("imageconvolution")) {
          $matrix = array(    array( -1, -1, -1 ),
          array( -1, 32, -1 ),
          array( -1, -1, -1 ) );
          $divisor = 24;
          $offset = 0;

          imageconvolution($dst, $matrix, $divisor, $offset);
          }*/

        // send the header and new image
        if($ext=='jpg')
        {
            $status = imagejpeg($dst, $output, 75);
        }
        else if ($ext=='png')
        {
            $status = imagepng($dst, $output, 9);
        }
        else if ($ext=='gif')
        {
            $status = imagegif($dst, $output);
        }
        else if ($ext == "bmp")
        {
            $status = imagewbmp($dst, $output);
        }
        else if ($ext == "webp")
        {
            $status = imagewebp($dst, $output);
        }
        else
        {
            return array("status"=>false,"error"=>"Illegal extension","extension"=>$ext);
        }

        // clear out the resources
        imagedestroy($src);
        imagedestroy($dst);
        return array("status"=>$status, "output"=>$output, "output_size"=>"$tn_width X $tn_height");
    }

}

?>