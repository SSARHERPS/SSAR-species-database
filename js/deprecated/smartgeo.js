var latitude='';
var longitude = '';

 function guessLocation()
	   {
	     if(navigator.geolocation) {
          
	       navigator.geolocation.getCurrentPosition(success_handler, error_handler, {enableHighAccuracy:true}); 
	     }
	     else {
	       document.getElementById("guessresult").innerHTML="Sorry, your browser doesn't support geolocation.";
	       var actionlink=document.getElementById("guessresult");
	       var ntnode=document.createTextNode(locationError);
	       actionlink.replaceChild(ntnode,actionlink.childNodes[0]);
	     }

	     
	   }

	     function success_handler(position) {
               latitude = position.coords.latitude;
               longitude = position.coords.longitude;
               accuracy = position.coords.accuracy;
	       locationError="However, we've guessed that you're located where the map shows on the right.";
	       var mapdata = 'https://maps.google.com/maps/api/staticmap?center=' + latitude + ',' + longitude + '&amp;zoom=16&amp;size=425x350&amp;sensor=false'; //var googledata
	       var guesslink='<?php $url=curPageURL(); $pos=strpos($url,"&lat"); if($pos!=false) $url=substr($url,0,$pos); echo $url;?>&amp;lat=' + latitude + '&amp;long=' + longitude;



	       var formdata=document.getElementById("geoloc_container");

	       var formnode=document.createTextNode(formdata);
	       var input1=document.createElement('input');
	       var input2=document.createElement('input');
	       input1.setAttribute('name','lat');
	       input1.setAttribute('value',latitude);
	       input1.setAttribute('type','hidden');
	       input2.setAttribute('name','lng');
	       input2.setAttribute('value',longitude);
	       input2.setAttribute('type','hidden');
	       input1.appendChild(formnode);
	       formdata.replaceChild(input1,formdata.childNodes[0]);
	       input2.appendChild(formnode);
	       //formdata.replaceChild(input1,formdata.childNodes[1]);
	       formdata.appendChild(input2);


	       var actionlink=document.getElementById("guessresult");
	       var emapel=document.getElementById("embeddedmap");
	       
	       var linknode=document.createTextNode('Location set &#8212; click to search locally &#187;');
	       var link=document.createElement('a');
	       link.setAttribute('href',guesslink);
	       link.appendChild(linknode);
	       actionlink.replaceChild(link,actionlink.childNodes[0]);
	       
	       var emapnode=document.createTextNode(emapel);
	       var map=document.createElement('img');
	       map.setAttribute('src',mapdata);
	       map.appendChild(emapnode);
	       emapel.appendChild(map);

	     }
	     function error_handler(error) {
               var locationError = '';
               switch(error.code){
                 case 0:
                   locationError = "There was an error while retrieving your location: " + error.message;
                   break;
                 case 1:
                   locationError = "The user prevented this page from retrieving a location.";
                   break;
                 case 2:
                   locationError = "The browser was unable to determine your location: " + error.message;
                   break;
                 case 3:
                   locationError = "The browser timed out before retrieving the location.";
                   break;
	       }
	       var actionlink=document.getElementById("guessresult");
	       var ntnode=document.createTextNode(locationError);
	       actionlink.replaceChild(ntnode,actionlink.childNodes[0]);

	     }       
