// Common JS functions for RAP
// ToDo: have smart errors
// Fun fillWeather as JS only

function init() {
    guessLocation();
    if(latitude=='' & slat!='') latitude=slat;
    if(longitude=='' & slng!='') longitude=slng;
    fillWeather();
    basepwgood=false;
    passmatch=false;
}

function checkPasswordLive() {
    var goodbg='#cae682';
    var badbg='#e5786d';
    var pass=$('#password').val();
    if(pass.length>=21) {
        $('#password').css('background',goodbg);
        basepwgood=true;
    }
    else if(pass.match(/^(?:(?=^.{6,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$)$/)) {
        $('#password').css('background',goodbg);
        basepwgood=true;
    }
    else {
        console.log('bad',badbg);
        $('#password').css('background',badbg);
        basepwgood=false;
    }
    if(!isNull($('#password2').val())) checkMatchPassword();
    toggleNewUserSubmit();
    return false;
}

function checkMatchPassword() {
    var goodbg='#cae682';
    var badbg='#e5786d';
    if($('#password').val()==$('#password2').val()) {
        $('#password2').css('background',goodbg);
        passmatch=true;
    }
    else {
        $('#password2').css('background',badbg);
        passmatch=false;
    }
    toggleNewUserSubmit();
    return false;
}

function toggleNewUserSubmit() {
    try {
        var dbool = passmatch && basepwgood ? false:true;
        $('#createUser_submit').attr('disabled',dbool);
    }
    catch(e) {
        passmatch=false;
        basepwgood=false;
    }
}

function setRank(skill,rank) {
    // on click call an ajax wrapper to set an individual's rank.
    animateLoad(skill+"-status",16);
    var urlString='conf='+conf+'&uid='+uid+'&action=rank&skill='+skill+'&val='+rank;
    //console.log(urlString);
    $.ajax({
        type:'GET',
        data:urlString,
        url:'ajax.php',
	dataType:'json',
        success: function(result) {
	    //console.log(result);
	    if(result[0]==true) {
		// success
		// remove 'set' from the old element, set on new one
		var parent=skill+'-rater';
		var children=document.getElementById(parent);
		var setEl=children.getElementsByClassName('set');
		var newSet='#'+skill+'-'+rank;
		var newSet2=skill+'-'+rank;
		if(typeof(setEl[0])!='undefined') {
		    var element=setEl[0];
		    //console.log(element);
		    var id='#'+$(element).attr('id');
		    //console.log('Remove set from id '+id);
		    $(id).removeClass('set');
		}
		var element=document.getElementById(newSet2);
		//console.log('Add set to '+newSet);
		$(newSet).addClass('set');
		stopLoad(skill+"-status");
	    }
	    else {
		// failure
		var id=skill+'-status';
		var container=document.getElementById(id);
		container.innerHTML="<p class='error'><small>Error - Could not save ("+result[1]+")</small></p>";
		console.log('setRank failed to save -'+result[1]);
		stopLoadError(skill+"-status");
	    }
        },
	error: function() {
	    console.log('setRank AJAX error');
	    stopLoadError(skill+"-status");
	},
    });
}
var floatBox="";
function writeFloatBox(string) {
    floatBox=string;
}
var fRes=false;
function writeFRes(bool) { fRes=bool };
function doSearch(boxId,floatContainerId) {
    // every letter check activities and users for answers 
    // get the text of the input box
    searchBox=document.getElementById(boxId);
    query=searchBox.value;
    floatContainer=document.getElementById(floatContainerId);
    state=window.getComputedStyle(floatContainer).display;
    var earthSemiPerim=20030795;
    var shorterDistance=45000; // 45km
    var dataString='conf='+conf+'&uid='+uid+'&action=search&query='+query+"&lat="+latitude+"&lng="+longitude+"&dist="+earthSemiPerim; // user validation requires user strings being passed
    // AJAX it out
    //console.log("Searching for  '"+query+"'");
    if(query.length>0) {
	$.ajax({
            type:'GET',
            data:dataString,
            url:'ajax.php',
	    dataType:'json',
            success: function(result) {
		fRes=false;
		if(result[0]==true) {
		    // success
		    resultList=result[1];
		    peopleList=result[2];
		    //console.log(result);
		    // float suggestions -- 3 suggestions
		    searchQueryString="search.php?search=";
		    searchPost="&amp;search_what=activities";
		    if(!isNull(resultList[0])) {
			fRes=true;
			floatBox="<div class='sugg_float'><p><a href='"+searchQueryString+resultList[0]+searchPost+"'>"+resultList[0]+"</a></p></div>";
			if(!isNull(resultList[1])) {
			    floatBox+="<div class='sugg_float'><p><a href='"+searchQueryString+resultList[1]+searchPost+"'>"+resultList[1]+"</a></p></div>";
			    if(!isNull(resultList[2])) floatBox+="<div class='sugg_float'><p><a href='"+searchQueryString+resultList[2]+searchPost+"'>"+resultList[2]+"</a></p></div>";
			}
		    }
		    else {
			// do a fuzzy match
			$.ajax({
			    type:'GET',
			    data:'action=fuzzy&query='+query,
			    url:'ajax.php',
			    dataType:'json',
			    success: function(result) {
				fRes=false;
				if(result[0]==true) {
				    // good search
				    resultList=result[1];
				    if(!isNull(resultList[0])) {
					fRes=true;
					floatBox="<div class='sugg_float'><p><a href='"+searchQueryString+resultList[0]+searchPost+"'>"+resultList[0]+"</a></p></div>";
					if(!isNull(resultList[1])) {
					    floatBox+="<div class='sugg_float'><p><a href='"+searchQueryString+resultList[1]+searchPost+"'>"+resultList[1]+"</a></p></div>";
					    if(!isNull(resultList[2])) floatBox+="<div class='sugg_float'><p><a href='"+searchQueryString+resultList[2]+searchPost+"'>"+resultList[2]+"</a></p></div>";
					}
					writeFloatBox(floatBox);
				    }
				    else {
					writeFloatBox("");
					console.log('No fuzzy results');
				    }
				}
				else {
				    console.log('doSearch fuzzy error - '+result['error']);
				    //console.log('Query: '+result['query']);
				}
				if(isNull(peopleList)) {
				    if(!isNull(floatBox)) {
					if(state=='none') floatContainer.style.display='block';
					floatContainer.innerHTML=floatBox;
				    }
				    else {
					if(state!='none') floatContainer.style.display='none';
					floatContainer.innerHTML="";
				    }
				}
				writeFRes(fRes);
			    },
			    error: function() {console.log('doSearch AJAX error (fuzzy)');}
			});
		    }
		    if(!isNull(peopleList)) {
			// populate people search
			//console.log('Found people');
			//console.log(fRes);
			searchPost="&amp;search_what=people"; // maybe just hardlink
			if(!fRes) floatBox="";
			else floatBox+="<hr/>";
			floatBox+="<div class='sugg_float'><p><a href='"+searchQueryString+peopleList[0]+searchPost+"'>"+peopleList[0]+"</a></p></div>";
			if(!isNull(peopleList[1])) {
			    floatBox+="<div class='sugg_float'><p><a href='"+searchQueryString+peopleList[1]+searchPost+"'>"+peopleList[1]+"</a></p></div>";
			    if(!isNull(peopleList[2])) floatBox+="<div class='sugg_float'><p><a href='"+searchQueryString+peopleList[2]+searchPost+"'>"+peopleList[2]+"</a></p></div>";
			}
			writeFloatBox(floatBox);
		    }
		    else console.log("Didn't find people");
		    //Narrow and fuzzy matches done
		    //console.log(floatBox);
		    if(!isNull(floatBox)) {
			//console.log('showing floatbox');
			if(state=='none') floatContainer.style.display='block';
			floatContainer.innerHTML=floatBox;
		    }
		    else {
			//console.log('hiding floatbox');
			if(state!='none') floatContainer.style.display='none';
			floatContainer.innerHTML="";
		    }
		}
		else console.log('doSearch error - '+result['error']);
            },
	    error: function() {console.log('doSearch AJAX error');}
	});
    }
    else {
	floatContainer.innerHTML="";
	if(state!='none') floatContainer.style.display='none';
    }
}
$('html').click(function() {
    var floatContainerId="search_sugg_box";
    floatContainer=document.getElementById(floatContainerId);
    state=window.getComputedStyle(floatContainer).display;
    if(state!='none') {
	floatContainer.style.display='none';
	floatContainer.innerHTML="";
    }
});

$('#search_sugg_box').click(function(event){
    event.stopPropagation();
});

function guessLocation() {
    if(navigator.geolocation) {
        
	navigator.geolocation.getCurrentPosition(success_handler, error_handler, {enableHighAccuracy:true}); 
    }
    else {
	//document.getElementById("guessresult").innerHTML
	var locationError="Sorry, your browser doesn't support geolocation.";
	$.cookie(cookiename+'_lat','false',{expires:.01}); // 15 minutes	       
	$.cookie(cookiename+'_fset','true',{expires:.01}); // 15 minutes	       
	var actionlink=document.getElementById("loc_msg");
	var ntnode=document.createTextNode(locationError);
	try {
	    actionlink.replaceChild(ntnode,actionlink.childNodes[0]);
	    actionlink.setAttribute('class','notice');
	}
	catch(e) {
	    // do nothing
	}
    }
    
    
}

function success_handler(position) {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
    accuracy = position.coords.accuracy;
    locationError="However, we've guessed that you're located where the map shows on the right.";
    var mapdata = 'https://maps.google.com/maps/api/staticmap?center=' + latitude + ',' + longitude + '&zoom=16&size=425x350&sensor=false'; //var googledata
    var guesslink=curUrl+'&lat=' + latitude + '&long=' + longitude;
    
    
    
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
    //formdata.replaceChild(input2,formdata.childNodes[1]);
    formdata.appendChild(input2);
    $.cookie(cookiename+'_lat',latitude,{expires:.01}); // 15 minutes	       
    $.cookie(cookiename+'_lng',longitude,{expires:.01}); // 15 minutes
    var tracklat=document.getElementById('tlat');
    var tracklng=document.getElementById('tlng');
    tracklat.innerHTML=latitude;
    tracklng.innerHTML=longitude;

    // set the weather

    var actionlink=document.getElementById("guessresult");
    if(typeof(actionlink)!='undefined') {
	var emapel=document.getElementById("embeddedmap");
	var linknode=document.createTextNode('Location set -- click to search locally.');
	var link=document.createElement('a');
	link.setAttribute('href',guesslink);
	link.appendChild(linknode);
	try {
	    actionlink.replaceChild(link,actionlink.childNodes[0]);
	    var emapnode=document.createTextNode(emapel);
	    var map=document.createElement('img');
	    map.setAttribute('src',mapdata);
	    map.appendChild(emapnode);
	    emapel.appendChild(map);
            $('#guessresult').children()[0].click();
	}
	catch(e) {
	    // do nothing
	} 
    }
    return {"lat":latitude,"lng":longitude};

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
    var actionlink=document.getElementById("loc_msg");
    var ntnode=document.createTextNode(locationError);
    try {
        actionlink.replaceChild(ntnode,actionlink.childNodes[0]);
    }
    catch (e) {
        // fail silently
    }

}


function hideLocSelect()
{
    document.getElementById('alt_loc_fs').classList.remove('show');
}
function showLocSelect()
{
    document.getElementById('alt_loc_fs').classList.add('show');
}
function showSearchOptions()
{
    var cont=document.getElementById('location_options');
    if(cont.classList.contains('show')) {
	cont.classList.remove('show')
	hideLocSelect();
	//document.getElementById('exp_so_button').innerHTML='(down)';
    }
    else {
	cont.classList.add('show');
	showLocSelect();
	//document.getElementById('exp_so_button').innerHTML='(up)';
    }

}
function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
function toFloat(str) {
    if(isNaN(str) || isEmpty(str) || isBlank(str)) return 0;
    return parseFloat(str);
}
function toInt(str) {
    if(isNaN(str) || isEmpty(str) || isBlank(str)) return 0;
    return parseInt(str);
}
function isEmpty(str) {
    return (!str || 0 === str.length);
}
function isBlank(str) {
    return (!str || /^\s*$/.test(str));
}
function isNull(str) {
    try {if(isEmpty(str) || isBlank(str)) return true;}
    catch(e){return false;}
    return false;
}
function hideShowEl(id) {
    if($('#'+id).hasClass('hide')) {
        $('#'+id).hide();
        $('#'+id).removeClass('hide');   
    }
    $('#'+id).toggle('fast');
}
function hideShow(containerId) {
    var container=document.getElementById(containerId);
    var state=window.getComputedStyle(container).display;
    if(state=='none') {
	container.style.display='block';
    }
    else {
	container.style.display='none';
    }
}
function showAllAct() {
    $('.adiv').each(function(el){
        if($(this).hasClass('hide')) {
            $(this).hide();
            $(this).removeClass('hide');   
        }
    });
    $('.adiv').show('fast');
}

jQuery.fn.exists = function(){
        return jQuery(this).length > 0;
 };

function animateLoad(parentElement,diameter) {
    if(isNull(diameter)) diameter=50;
    var elId='#'+parentElement;
    if($(elId).exists()) {
	var sm_diameter=roundNumber(diameter*.5,0);
	$(elId).find('.ball').removeClass('stop nodisp');
	$(elId).find('.ball1').removeClass('stop nodisp');
	$(elId).find('.ball').css('width',diameter+"px");
	$(elId).find('.ball').css('height',diameter+"px");
	$(elId).find('.ball1').css('width',sm_diameter+"px");
	$(elId).find('.ball1').css('height',sm_diameter+"px");
	var offset=roundNumber(diameter/2+sm_diameter/2+9,0);
	$(elId).find('.ball1').css('top',"-"+offset+"px");
	return true;
    }
    return false;
}

function stopLoad(parentElement) {
    var elId='#'+parentElement;
    if($(elId).exists()) {
	$(elId).find('.ball').addClass('stop nodisp');
	$(elId).find('.ball1').addClass('stop nodisp');
    }
}

function stopLoadError(parentElement) {
    var elId='#'+parentElement;
    if($(elId).exists()) {
	$(elId).find('.ball1').addClass('bballerror');
	$(elId).find('.ball').addClass('bballerror');
	$(elId).find('.ball').addClass('ballerror');
	$(elId).find('.ball1').addClass('ball1error');
	setTimeout(function() {
	    $(elId).find('.ball').addClass('stop nodisp');
	    $(elId).find('.ball1').addClass('stop nodisp');
	    $(elId).find('.ball').removeClass('bballerror');
	    $(elId).find('.ball1').removeClass('bballerror');
	    $(elId).find('.ball').removeClass('ballerror');
	    $(elId).find('.ball1').removeClass('ball1error');
	    },1000);
    }
}

function fillWeather(unit) {
    var apikey="03da979c8e65825d2c2a9bd79062c742";
    var urlDest="http://api.openweathermap.org/data/2.1/find/city";
    var dataString='lat='+latitude+'&lng='+longitude+'&appid='+apikey;
    // Check if 'latitude' and 'longitude' are set, run only if they do
    if(typeof(latitude)!='undefined') {
	$.ajax({
            type:'GET',
            url:urlDest,
            data:dataString,
            dataType:'jsonp',//json
            success: function(resultSet) {
		// results returned as a JSON, check relevant points and fill HTML
		//console.log(resultSet);
		var subarr=resultSet['list'];
		var listEl=subarr[0];
		var result=listEl['main'];
		var temp=Math.round(result['temp']-273.15);
		if(unit=='imperial') {
		    temp=temp*1.8+32;
		    temp=temp+"<sup>o</sup> F";
		}
		else temp=temp+"<sup>o</sup> C";
		var wind=listEl['wind'];
		var windSpeed=wind['speed'];
		var windDirection=wind['deg'];
		var text=listEl['weather'];
		var desc=text[0]['description'];
		// convert to human values
		document.getElementById('wtemp').innerHTML=temp;
		document.getElementById('wdesc').innerHTML=desc;
		var windLong="Wind: "
		if(unit=='imperial') {
		    windSpeed=roundNumber(windSpeed*2.2237,2);
		    windLong+=windSpeed+" mph "+windDirection;
		}
		else windLong+=windSpeed+" m/s "+windDirection;
		document.getElementById('wwind').innerHTML=windLong;
            },
            error: function() { console.log('fillWeather AJAX error',urlDest+"?"+dataString); }
	});
    }
}

function degToCardinal(deg) {
// convert a degree in angles to a cardinal direction

}

function roundNumber(number, digits) {
    var multiple = Math.pow(10, digits);
    var rndedNum = Math.round(number * multiple) / multiple;
    return rndedNum;
}

function givePlus(activity,alt) {
    // AJAX call to give a +1 interaction
    var statusbox=activity+"-pstatus";
    animateLoad(statusbox,16);
    try {
        if(isNull(prouid)) prouid=alt;
    }
    catch (e) {
        prouid=alt;
    }
    try {
        var dataString= "action=giveplus&uid="+uid+"&conf="+conf+"&puid="+prouid+"&act="+activity;
        $.ajax({
            type:'GET',
            data:dataString,
            url:'ajax.php',
	    dataType:'json',
            success: function(result) {
	        if(result[0]) {
		    e=$("#"+activity+"-plus").children()[0];
		    e.classList.add('clicked');
		    e.removeAttribute('onmouseout');
		    e.removeAttribute('onmouseover');
		    dataString= "action=getplus&puid="+prouid+"&act="+activity;
		    $.ajax({
		        type:'GET',
		        data:dataString,
		        url:'ajax.php',
		        dataType:'json',
		        success: function(res2) {
			    // replace the plus total with the live plus total.
			    if(res2[0]!==false) {
			        e.innerHTML="+"+res2[0];
			        stopLoad(statusbox);
			    }
			    else {
			        console.log("givePlus error [Jx01] - could not get updated plus count");
			        stopLoadError(statusbox);
			    }
		        },
		        error: function() {
			    console.log("givePlus error  [Jx02] - AJAX failure to get updated plus count");
			    stopLoadError(statusbox);
		        }
		    });	
	        }
	        else {
		    console.log("givePlus error [Jx03] - "+result['error']);
		    /*if(!isNull(result['query'])) console.log("Query - "+result['query']);
		      if(!isNull(result['action'])) console.log("Action - "+result['action']);
		      if(!isNull(result['args'])) console.log("Args - "+result['args']);*/
		    if(!isNull(result['erroraction'])) {
		        if(result['erroraction']=='disable') {			
			    // disable onclicks for this on page for "disable"
			    var targs=$('.plusone');
			    [].forEach.call(targs,function(el) {
			        el.removeAttribute('onclick');
			        el.setAttribute('title',"You've exceeded your max plus interactions today. Please try again later.");
			    });
			    stopLoadError(statusbox);
		        }
		        else if(result['erroraction']=='update') {
			    // check current +1, and update, for "update"
			    $.ajax({
			        type:'GET',
			        data:dataString,
			        url:'ajax.php',
			        dataType:'json',
			        success: function(res2) {
				    // replace the plus total with the live plus total.
				    if(res2[0]!==false) {
				        e.innerHTML="+"+res2[0];
				        stopLoad(statusbox);
				    }
				    else {
				        console.log("givePlus error [Jx04] - could not get updated plus count");
				        stopLoadError(statusbox);
				    }
			        },
			        error: function() {
				    console.log("givePlus error [Jx05] - AJAX failure to get updated plus count");
				    stopLoadError(statusbox);
			        }
			    });
		        }
		        else {
			    // mystery uncorrectable error
			    stopLoadError(statusbox);
		        }
		    }
		    else {
		        // No erroraction defined
		        console.log("No defined error action","uid:"+uid,"conf:"+conf,"prouid:"+prouid,activity);
		        stopLoadError(statusbox);
		    }
	        }
	    },
	    error: function() {
	        console.log("givePlus() AJAX error. [Jx06] ");
	        stopLoadError(statusbox);
	    }
        });
    }
    catch (e) {
        console.log("givePlus() Javascript error. [Jx07] ",e);
	stopLoadError(statusbox);
    }
}

function hoverIncrementPlus(id) {
    e=$("#"+id).children()[0];
    if(!e.classList.contains('clicked')) {
	p=e.innerHTML.substr(1);
	n=toInt(p)+1;
	e.innerHTML="+"+n;
    }
}
function leaveDecrementPlus(id) {
    e=$("#"+id).children()[0];
    if(!e.classList.contains('clicked')) {
	p=e.innerHTML.substr(1);
	n=toInt(p)-1;
	e.innerHTML="+"+n;
    }
}

function markInstructor(dblink) {
    animateLoad('instructor-status',16);
    var dataString= "action=markinstructor&uid="+uid+"&conf="+conf+"&act="+dblink;
    $.ajax({
        type:'GET',
        data:dataString,
        url:'ajax.php',
      	dataType:'json',
        success: function(result) {
          if(result[0]) {
              console.log("Sucessfully updated instructor status");
	      stopLoad('instructor-status');
          }
          else {
	      console.log("Failed to update instructor status with error '"+result['error']+"'")
	      stopLoadError('instructor-status');
          }
        },
        error: function() {
	    console.log("markInstructor() AJAX error.","Accessing "+location.protocol+"//"+location.host+"/ajax.php?"+dataString);
	    // untoggle state
	    if($('#instruction').prop('checked')) $('#instruction').prop('checked',false);
	    else $('#instruction').prop('checked',true);
	    stopLoadError('instructor-status');
	}
      });
}



function dynamicScroll(container, callFunction,functionArgs) {
    //console.log("Scroll Event Called");
    var scrolltop=$(container).scrollTop();
    var scrollheight=$(container)[0].scrollHeight;
    var windowheight=$(container).height();
    var scrolloffset=50;  
    if(scrolltop>=(scrollheight-(windowheight+scrolloffset)))  
    {  
        //fetch new items  
	animateLoad('scroll-status-container',16);
	//console.log("Attempting to fetch data ...");
        $('#scroll-status').text('Loading more items...');  
	callFunction(functionArgs,container);
    }
    //else console.log("No data needed to be fetched.");
}


function getMoreThumbs(column,container,match,table,startCount,endCount,xmlTag) {
    //console.log("getMoreThumbs called succesfully");
    if(typeof(table)==='undefined') table='activity_table';
    if(typeof(startCount)==='undefined') startCount=$(container).find("img").length;
    if(typeof(endCount)==='undefined') endCount=startCount+50;
    if(typeof(xmlTag)==='undefined') xmlTag=false;
    if(endCount<startCount) endCount=startCount+endCount;
    //console.log("AJAxing -- ",startCount,endCount,typeof(startCount),typeof(endCount))
    if(typeof(match)==='undefined') {
	// assume we got just one value in, a json object -- check
	try {
	    //console.log("Trying to parse json",column);
	    // var jsonObject=jQuery.parseJSON(column);
	    //console.log("JSON parsed");
	    match=column['data'];
	    //console.log("match set",match);
	    if(typeof(column['table'])!=='undefined') table=column['table']
	    if(typeof(column['start'])!=='undefined') startCount=column['start']
	    if(typeof(column['end'])!=='undefined') endCount=column['end']
	    if(typeof(column['xml'])!=='undefined') xmlTag=column['xml']
	    column=column['column'];
	    //console.log("Column redefined",column);
	    if(typeof(match)==='undefined' && typeof(column)==='undefined'){
		console.log("JSON was malformed, and match and column were improperly set.",match,column);
		stopLoadError('scroll-status-container');
		return false;
	    }
	}
	catch (e) {
	    // failed
	    console.log("Invalid number of arguments passed.");
	    stopLoadError('scroll-status-container');
	    return false;
	}
    }
    var dataString="action=getImages&table="+table+"&match="+match+"&column="+column+"&start="+startCount+"&end="+endCount+"&xml="+xmlTag;
    //console.log("Entering AJAX, testing http://test.reallyactivepeople.com/ajax.php?"+dataString);
    $.ajax({
	type:'GET',
	data:dataString,
	url:'ajax.php',
	dataType:'json',
	success: function(result) {
	    // return data and details
	    if(result[0]) {
		// the PHP function always returns the number of extra found. This isn't needed when the first batch is loaded.
		var startLength=$(container).children().length;
		$(container).append(result['data']);  
		if(startLength>0) {
		    $('#scroll-status').text(result['details']);
		    setTimeout(function(){$(container).getNiceScroll().resize();},100);
		}
		else {
		    $('#scroll-status').text('');
		    setTimeout(function(){$(container).niceScroll({dblclickzoom:false,autohidemode:false,cursorcolor:"#eee"});},100);
		}
		//setTimeout($('#scroll-status').text(''),10000);
		//console.log("Returned results.");
		stopLoad('scroll-status-container');
	    }
	    else {
		console.log("The result returned an error.");
		console.log("dynamicScroll failure -- was unable to load new content. Got error "+result['error'],result['result']);
		$('#scroll-status').text('Load error: '+result['error']);
		stopLoadError('scroll-status-container');
	    }
	},
	error: function () {
	    console.log("getMoreThumbs error - AJAX failed to get more content");
	    stopLoadError('scroll-status-container');
	    }
	});

}


function getEditBlock(caller,col,tag,table,db,placetext) {
    // pull the edit block from the server, replace the displayed
    // block with an edit form and save button
    var aid=$($(caller).parent().parent().parent().find('div')[1]).attr('id')
    animateLoad(aid,16);
    // to change from "undefined" to null, by using the
    // loosely-checking isNull
    if(isNull(table)) table=null;
    if(isNull(db)) db=null;
    var dataString="action=getEdit&uid="+uid+"&conf="+conf+"&col="+col+"&tag="+tag+"&t="+table+"&d="+db;
    var url="ajax.php";
    // new edit block doesn't care about displayed contents - just
    // pull straight from db and display.
    //console.log('attempting edit','http://test.reallyactivepeople.com/'+url+"?"+dataString);
    var pullEdit=$.post(url,dataString,'json');
    pullEdit.done(function(result){
        if(result[0]) {
            // good result, replace field
            if(isNull(result['base64'])) decoded='';
            else decoded=decode64(result['base64']);
            if(isNull(placetext)) placetext="Type here: If you feel like sharing, tell people about your interest.  You&#39;ll be glad you did. How did you get started?  Time spent per week?  Looking for others to do it with?  Consider yourself a good local resource?  Have a favorite local shop to talk about?  Looking for motivation?";
            html="<textarea id='"+tag.replace(",","_")+"_textarea' placeholder='"+placetext+"'>"+decoded+"</textarea>";
            $($(caller).parent().parent().parent().find('div')[0]).html(html);
            // $('#act_bio_textarea').parent().next().children().children().click()
            // rebind the onclick to save, change text.
            $(caller).attr('onclick',"saveEditBlock(this,'"+col+"','"+tag+"','"+table+"','"+db+"');return false;"); 
            $(caller).html('Save &#187;');
            stopLoad(aid);
        }
        else {
            stopLoadError(aid);
            console.log(result['error']);
        }
    });
    pullEdit.fail(function(result,status){
        stopLoadError(aid);
        console.log("getEditBlock AJAX error");
    });
}

function saveEditBlock(caller,col,tag,table,db) {
    var aid=$($(caller).parent().parent().parent().find('div')[1]).attr('id')
    animateLoad(aid,16);
    if(isNull(table)) table=null;
    if(isNull(db)) db=null;
    if(isNull(tag)) tag=null;
    var data=$(caller).parent().parent().parent().find('textarea').val();
    var data64=encode64(data);
    var dataString="action=saveEdit&uid="+uid+"&conf="+conf+"&col="+col+"&tag="+tag+"&data="+data64+"&t="+table+"&d="+db;
    var url="ajax.php";
    //console.log('attempting edit','http://test.reallyactivepeople.com/'+url+"?"+dataString);
    var saveBlock=$.post(url,dataString,'json');
    saveBlock.done(function(result){
        //console.log('Call succeeded',result);
        if(result[0]) {
            try {
            // save succeeded, replace stuff
                html=decode64(result['base64']);
                $($(caller).parent().parent().parent().find('div')[0]).html(html);
                $(caller).attr('onclick',"getEditBlock(this,'"+col+"','"+tag+"','"+table+"','"+db+"');return false;");
                $(caller).html('Edit &#187;');
                stopLoad(aid);
            }
            catch (e) {
                console.log('caught an error',e,result);
            }
        }
        else {
            stopLoadError(aid);
            console.log(result['error']);
        }
    });
    saveBlock.fail(function(result,status){
        stopLoadError(aid);
        console.log("saveEditBlock AJAX error");
    });
}

function addRow(caller) {
    // add a new row set
    id=$(caller).parent().attr('id');
    $(caller).remove();
    $('#'+id).append("<span class='gear_name' onclick='editRow(this)'><span>Gear name</span></span><span>&#187;</span><span class='gear_desc' onclick='editRow(this)'><span>Gear description</span></span><a href='#' class='newrow-arbiter' onclick='addRow(this);return false;'>Add Row</a>");
}

function editRow(t) {
    // edit the clicked row pair
    // see if another row is being edited; if it is, save it and
    // remove the inputs
    if($('#gn_edit')!==undefined) {
        p=$('#gn_edit').parent();
        p.attr('onclick','editRow(this)');
        p.removeClass('nohover');
        html=$('#gn_edit').val();
        if(isNull(html)) html="<span>Gear name</span>";
        p.html(html);
        p=$('#gd_edit').parent();
        p.attr('onclick','editRow(this)');
        p.removeClass('nohover');
        html=$('#gd_edit').val();
        if(isNull(html)) html="<span>Gear description</span>";
        p.html(html);
        $('.closeicon').remove();
    }
    gn='';
    gd='';
    if($(t).attr('class')=='gear_name') {
        gn=$(t);
        gd=$(t).next().next();
        f=$(t);
    }
    else if($(t).attr('class')=='gear_desc') {
        gn=$(t).prev().prev();
        gd=$(t)
        f=$(t);;
    }
    else {
        try {
            gn=$(t).prev();
            gd=$(t).next();
            f=gn;
        }
        catch (e) {
            console.log('Bad caller');
            return false;
        }
    }
    orig_name=gn.text();
    orig_desc=gd.text();
    //console.log(orig_name,orig_name=="Gear name");
    if(orig_name=="Gear name") gn.html("");
    if(orig_desc=="Gear description") gd.html("");
    var idstring=orig_name+orig_desc;
    html="<input type='text' id='gn_edit' value='"+gn.text()+"' placeholder='Gear name' maxlength='200'/>";
    var gnw=gn.width();
    gn.css('width',gnw+"px");
    gn.html(html);
    gn.children().css('width',gnw+"px");
    var gdw=gd.width();
    gd.css('width',gdw+"px");
    html="<input type='text' id='gd_edit' value='"+gd.text()+"' placeholder='Gear description' maxlength='2000'/>";
    var htmlc="<div class='closeicon' onclick='deleteGearRow()'><span>x</span></div><div class='closeicon' onclick='linkGearRow()'><svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 380 184'><g stroke='#000' stroke-width='20' stroke-miterlimit='10' fill='none'><path d='M380.246 129.115h-350.199s46.47 35.211 43.595 50.781'/><path d='M0 56.896h350.198s-46.47-35.211-43.595-50.781'/></g></svg></div>"; // close icon to wipe row
    gd.html(html);
    gd.after(htmlc);
    gd.children().css('width',gdw+"px");
    gd.addClass('nohover');
    gd.attr('onclick','');
    gn.addClass('nohover');
    gn.attr('onclick','');
    f.children().focus(); // focus on the clicked element

    // Generalize unfocus
    $('.gear_container input').blur(function() { 
        if(!$('.closeicon').is(':focus')) saveGearRow();
    });

    // special keys
    $('.gear_container input').keydown(function(e) { 
        // enter saves
        if(e.which==13) {
            $(this).blur();
            // defocus
            p=$('#gn_edit').parent();
            p.attr('onclick','editRow(this)');
            p.removeClass('nohover');
            html=$('#gn_edit').val();
            if(isNull(html)) html="<span>Gear name</span>";
            p.html(html);
            p=$('#gd_edit').parent();
            p.attr('onclick','editRow(this)');
            p.removeClass('nohover');
            html=$('#gd_edit').val();
            if(isNull(html)) html="<span>Gear description</span>";
            p.html(html);
        }
        // escape cancels
        if(e.which==27) {
            p=$('#gn_edit').parent();
            p.attr('onclick','editRow(this)');
            p.removeClass('nohover');
            html=orig_name;
            if(html=="Gear name") html="<span>Gear name</span>";
            p.html(html);
            p=$('#gd_edit').parent();
            p.attr('onclick','editRow(this)');
            p.removeClass('nohover');
            html=orig_desc;
            if(html=="Gear description") html="<span>Gear description</span>";
            p.html(html);
        }
        // tab goes to next row (creates if absent), focuses edits
        if(e.which==9 && $(this).attr('id')=='gd_edit') {
            e.preventDefault();
            $(this).blur();
            pid=$(this).parent().parent().attr('id');
            if($(this).parent().next().next().next().prop('tagName')=="A") {
                // this only triggers if hopping over [delete][link] -> [link], so 3 nexts
                $(this).parent().next().next().next().click(); // add a row
                $(this).parent().next().next().next().click(); // click the next element, skip delete and link
            }
            else $(this).parent().next().click();
        }
    });
    // generalize to the parent box's one
    pid=$('#gn_edit').parent().parent().attr('id');
    type= pid.indexOf('sell')>=0 ? "sell":"want";
    if($('#'+type+'-gear_minicontainer .newrow-arbiter')[0]==undefined) {
        $(t).parent().append("<a href='#' class='newrow-arbiter' onclick='addRow(this);return false;'>Add Row</a>");
        $(t).parent().parent().append("<input type='hidden' id='gear_identifier' value='"+$.md5(idstring)+"'/>");
    }
    else {

    }
    name=$('#gn_edit').val();
    desc=$('#gd_edit').val();
    idstring=name+desc;
    md5=$.md5(idstring);
    $('#gear_identifier').val(md5); // reset
}

function saveGearRow(t) {
    // get #gd_edit and #gn edit , save (overwrite entry) and replace
    // input with value from inputs
    // generalize load animation to sell or want, and downstream
    pid=$('#gn_edit').parent().parent().attr('id');
    type= pid.indexOf('sell')>=0 ? "sell":"want";
    animateLoad('gear-'+type+'-status-container',16);    
    name=$('#gn_edit').val();
    desc=$('#gd_edit').val();
    idstring=name+desc;
    md5=$.md5(idstring);
    obj= new Object;
    obj['name']=name;
    obj['desc']=desc;
    obj['id']=md5;
    jos=JSON.stringify(obj);
    jos64=encode64(jos);

    act=$.getQueryParam('act');
    old_id=$('#gear_identifier').val();
    // update the identifier with the new row
    $('#gear_identifier').val(md5);
    var dataString="action=saveGear&uid="+uid+"&conf="+conf+"&type="+type+"&new="+jos64+"&id="+old_id+"&act="+act;
    var url="ajax.php";
    if(!$('.closeicon').is(':focus')) {
        //console.log('attempting save','http://test.reallyactivepeople.com/'+url+"?"+dataString+"&debug=1");
        //console.log('Should have saved here',old_id,"new",md5);
        var queued=jQuery.ajaxQueue({
            type:'POST',
            data:dataString,
            url:url,
            dataType:'json'});
        queued.done(function(result){
            //console.log('Queue call succeeded',result);
            if(result[0]) {
                // on successful save, update the id value in the identifier tag,
                // as the user may just be moving between fields rather than to a
                // new row altogether
                $('#gear_identifier').val(md5);
                // if the focused element isn't one of the editor fields, save it
                // and de-input it 
                if(!$('#gn_edit').is(':focus') && !$('#gd_edit').is(':focus') && t!=true) {
                    //console.log('filling bits');
                    p=$('#gn_edit').parent();
                    p.attr('onclick','editRow(this)');
                    p.removeClass('nohover');
                    html=$('#gn_edit').val();
                    if(isNull(html)) html="<span>Gear name</span>";
                    p.html(html);
                    p=$('#gd_edit').parent();
                    p.attr('onclick','editRow(this)');
                    p.removeClass('nohover');
                    html=$('#gd_edit').val();
                    if(isNull(html)) html="<span>Gear description</span>";
                    p.html(html);
                    $('.closeicon').remove();
                }
                if(t) {
                    // remove the elements altogether
                    //console.log('should pop elements',p1.html(),p2.html(),p3.html());
                    p3.remove();
                    p2.remove();
                    p1.remove();
                    $('.closeicon').remove();

                }
                stopLoad('gear-'+type+'-status-container');                
            }
            else {
                // Didn't work! 
                console.log(result['error']);
                stopLoadError('gear-'+type+'-status-container');
                try {
                    // restore bits that got hidden
                    p1.css('display','');
                    p2.css('display','');
                    p3.css('display','');
                }
                catch(e) {
                    // fail silently ... as likely as not, it wasn't applicable.
                }
            }
        });
        queued.fail(function(result,status){
            console.log("saveGearRow AJAX error",result,status);
            stopLoadError('gear-'+type+'-status-container');
            try {
                // restore bits that got hidden
                p1.css('display','');
                p2.css('display','');
                p3.css('display','');
            }
            catch(e) {
                // fail silently ... as likely as not, it wasn't applicable.
            }
        });
    }
}

function deleteGearRow() {
    /*
     * Delete the contents of a gear row
     */
    // erase contents then retrigger a save
    $('#gd_edit').val('');
    $('#gn_edit').val('');
    p1=$('#gn_edit').parent();
    p2=$('#gd_edit').parent();
    p3=p1.next();
    saveGearRow(true);
    // immediately hide the rows
    p1.css('display','none');
    p2.css('display','none');
    p3.css('display','none');
    $('.closeicon').css('display','none');
}

function linkGearRow() {
    /*
     * Provide a popop to search a list and add this gear to other categories ....
     */
    console.log('pop up an overlay');
}


function validateUserOverride() {
    console.log("Sending","uid:"+uid,"conf:"+conf,"prouid:"+prouid);
    var dataString= "action=validate&uid="+uid+"&conf="+conf+"&puid="+prouid
    $.ajax({
        type:'GET',
        data:dataString,
        url:'ajax.php',
	dataType:'json',
        success: function(result) {console.log(result);},
	error: function() {console.log("AJAX error.");},
    });
    console.log("End");
}
