var basepwgood = false;
var passmatch = false;
var goodbg = '#cae682';
var badbg = '#e5786d';
if (isNull(passLengthOverride)) passLengthOverride = 21;
// Need global variable to build minimum password length

function checkPasswordLive() {
    // the "8" needs to be passMinLen
    var pass = $('#password').val();
    if (pass.length >= passLengthOverride) {
        $('#password').css('background', goodbg);
        basepwgood = true;
    } else if (pass.match(/^(?:(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$)$/)) {
        $('#password').css('background', goodbg);
        basepwgood = true;
    } else {
        //console.log('bad', badbg);
        $('#password').css('background', badbg);
        basepwgood = false;
    }
    evalRequirements();
    if (!isNull($('#password2').val())) checkMatchPassword();
    toggleNewUserSubmit();
    return false;
}

function checkMatchPassword() {
    if ($('#password').val() == $('#password2').val()) {
        $('#password2').css('background', goodbg);
        passmatch = true;
    } else {
        $('#password2').css('background', badbg);
        passmatch = false;
    }
    toggleNewUserSubmit();
    return false;
}

function toggleNewUserSubmit() {
    try {
        var dbool = passmatch && basepwgood ? false : true;
        $('#createUser_submit').attr('disabled', dbool);
    } catch (e) {
        passmatch = false;
        basepwgood = false;
    }
}

function evalRequirements() {
    /*
     * Evaluate the requirements of the password, check off boxes
     */
    if (!$("#strength-meter").exists()) {
        // create the strength meter
        var html = "<div id='strength-meter'><div id='strength-requirements'><div id='strength-alpha'><p class='label'>a</p><div class='strength-eval'></div></div><div id='strength-alphacap'><p class='label'>A</p><div class='strength-eval'></div></div><div id='strength-numspecial'><p class='label'>1/!</p><div class='strength-eval'></div></div></div><div id='strength-bar'><progress id='password-strength' max='4'></progress></div></div>";
        $("#login .right").append(html);
    }
    var pass = $('#password').val();
    var pstrength = zxcvbn(pass);
    $(".strength-eval").css("background", badbg);
    if (pass.length >= passLengthOverride) {
        $(".strength-eval").css("background", goodbg);
    } else {
        if (pass.match(/^(?:((?=.*\d)|(?=.*\W+)).*$)$/)) {
            $("#strength-numspecial .strength-eval").css("background", goodbg);
        }
        if (pass.match(/^(?=.*[a-z]).*$/)) {
            $("#strength-alpha .strength-eval").css("background", goodbg);
        }
        if (pass.match(/^(?=.*[A-Z]).*$/)) {
            $("#strength-alphacap .strength-eval").css("background", goodbg);
        }
    }
    $("#password-strength").attr("value",pstrength.score);
}

if (typeof isNumber !== "function") {
    window.isNumber = function(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }
}

if (typeof toFloat !== "function") {
    window.toFloat = function(str) {
        if (isNaN(str) || isEmpty(str) || isBlank(str)) return 0;
        return parseFloat(str);
    }
}

if (typeof toInt !== "function") {
    window.toInt = function(str) {
        if (isNaN(str) || isEmpty(str) || isBlank(str)) return 0;
        return parseInt(str);
    }
}

if (typeof isEmpty !== "function") {
    window.isEmpty = function(str) {
        return (!str || 0 === str.length);
    }
}

if (typeof isBlank !== "function") {
    window.isBlank = function(str) {
        return (!str || /^\s*$/.test(str));
    }
}

if (typeof isNull !== "function") {
    window.isNull = function(str) {
        try {
            if (isEmpty(str) || isBlank(str)) return true;
        } catch (e) {
            return false;
        }
        return false;
    }
}

if (typeof hideShowEl !== "function") {
    window.hideShowEl = function(id) {
        // legacy
        id = id.search("#") === 0 ? id : "#" + id;
        if ($(id).hasClass('hide')) {
            $(id).hide();
            $(id).removeClass('hide');
        }
        $(id).toggle('fast');
    }
}

if (typeof hideShow !== "function") {
    window.hideShow = function(containerId) {
        // legacy
        containerId = containerId.search("#") === 0 ? containerId : "#" + containerId;
        $(containerId).toggle();
    }
}

jQuery.fn.exists = function() {
    return jQuery(this).length > 0;
};

if (typeof animateLoad !== "function") {
    window.animateLoad = function(parentElement, diameter) {
        if (isNull(diameter)) diameter = 50;
        var elId = '#' + parentElement;
        if ($(elId).exists()) {
            var sm_diameter = roundNumber(diameter * .5, 0);
            $(elId).find('.ball').removeClass('stop nodisp');
            $(elId).find('.ball1').removeClass('stop nodisp');
            $(elId).find('.ball').css('width', diameter + "px");
            $(elId).find('.ball').css('height', diameter + "px");
            $(elId).find('.ball1').css('width', sm_diameter + "px");
            $(elId).find('.ball1').css('height', sm_diameter + "px");
            var offset = roundNumber(diameter / 2 + sm_diameter / 2 + 9, 0);
            $(elId).find('.ball1').css('top', "-" + offset + "px");
            return true;
        }
        return false;
    }
}

if (typeof stopLoad !== "function") {
    window.stopLoad = function(parentElement) {
        var elId = '#' + parentElement;
        if ($(elId).exists()) {
            $(elId).find('.ball').addClass('stop nodisp');
            $(elId).find('.ball1').addClass('stop nodisp');
        }
    }
}

if (typeof stopLoadError !== "function") {
    window.stopLoadError = function(parentElement) {
        var elId = '#' + parentElement;
        if ($(elId).exists()) {
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
            }, 1000);
        }
    }
}

if (typeof roundNumber !== "function") {
    window.roundNumber = function(number, digits) {
        var multiple = Math.pow(10, digits);
        var rndedNum = Math.round(number * multiple) / multiple;
        return rndedNum;
    }
}
