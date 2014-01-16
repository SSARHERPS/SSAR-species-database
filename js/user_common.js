function checkPasswordLive() {
    var goodbg='#cae682';
    var badbg='#e5786d';
    var pass=$('#password').val();
    if(pass.length>=passLengthOverride) {
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


function roundNumber(number, digits) {
    var multiple = Math.pow(10, digits);
    var rndedNum = Math.round(number * multiple) / multiple;
    return rndedNum;
}

