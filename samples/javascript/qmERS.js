/*

qmERS.js

Javascript functions for using the Questionmark XPoint

*/

/* *******************************************
Submit a simple statement to XPoint 
<actor> <verb> <object>
actor - the name of the person the statement concerns
verb - what the person did, see http://tincanapi.wikispaces.com/ADL+Experience+API+Companion+Document
object - the name of activity the statement concerns
e.g.
<John> <completed> <safety training>

Uses settings from qmERS.config.js for endpoint URL, account name etc
*/

function NotifyStatement(actor, verb, object) {

    var statement = CreateStatement(g_language, actor, "", "", verb, object, object, window.location.href.removeHash(), "media", "", "", "", "");

    sendStatement(g_notify, statement, null, g_user, g_accountKey);

}

/* *******************************************
Simple wrapper to submit a comment statement to XPoint 

name - user name
activity - name of the activity being rated
comment - the comment made

*/
function SubmitCommentStatement(name, activity, comment) {
    NotifyComment(name, "commented", activity, comment);
}



/* *******************************************
Simple wrapper to submit a rating statement to XPoint 

rating - the rating given
max - the maximum rating possible
name - user name
activity - name of the activity being rated

*/
function SubmitRatingStatement(rating, max, name, activity) {
    NotifyRating(name, "rated", activity, rating, max);
}

/* *******************************************
Submit a rating statement to XPoint 
<actor> <verb> <object> <score>
actor - the name of the person the statement concerns
verb - what the person did, see http://tincanapi.wikispaces.com/ADL+Experience+API+Companion+Document
object - the name of activity the statement concerns
rating - the rating given
max - the maximum rating possible
e.g.
<John> <rated> <safety training> <4> out of <5>

Uses settings from qmERS.config.js for endpoint URL, account name etc
*/
function NotifyRating(actor, verb, object, rating, max) {

    var scaled = (rating / max);

    var statement = CreateStatement(g_language, actor, "", "", verb, object, object, window.location.href.removeHash(), "media", scaled, rating, 0, max);

    sendStatement(g_notify, statement, null, g_user, g_accountKey);

}

/* *******************************************
Submit a comment statement to XPoint 
<actor> <verb> <object> <response>
actor - the name of the person the statement concerns
verb - what the person did, see http://tincanapi.wikispaces.com/ADL+Experience+API+Companion+Document
object - the name of activity the statement concerns
comment - the comment given

e.g.
<John> <commented> <safety training> <very good>

Uses settings from qmERS.config.js for endpoint URL, account name etc
*/
function NotifyComment(actor, verb, object, comment) {

    // escape response text using fake div elment
    var response = $('<div/>').text(comment).html()

    var statement = CreateStatement(g_language, actor, "", "", verb, object, object, window.location.href.removeHash(), "media", 0, 0, 0, 0, response);

    sendStatement(g_notify, statement, null, g_user, g_accountKey);

}

/* *******************************************
Submit a simple statement to XPoint 
<actor> <verb> <object>
actor - the name of the person the statement concerns
verb - what the person did, see http://tincanapi.wikispaces.com/ADL+Experience+API+Companion+Document
objectName - the name of activity the statement concerns
objectId - a unique ID for the activity
objectType - the type of activity, see http://tincanapi.wikispaces.com/ADL+Experience+API+Companion+Document

e.g.
<John> <completed> <safety training>

Uses settings from qmERS.config.js for endpoint URL, account name etc

*/
function SubmitSimpleStatement(actor,verb,objectName,objectId,objectType) {

    var resultHandler = function (res) { console.log("Statement " + res + " submitted");}

    var statement = CreateStatement(g_language, actor, "", "", verb, objectName, objectName, objectId, objectType); 

    sendStatement(g_notify, statement, null, g_user, g_accountKey);

}

/* *******************************************

Create an XAPI statement

language - the language code to use, e.g. 'en-US'
actorName - the name of the actor
actorEmail - actors email address
actorEmailHash - SHA1 hashcode of actors email address
verb - the verb for the statement, e.g. 'completed'
activityName - the name of the activity
activityDescription - a description of the activity
activityId - the activity ID
activityType - the type of activity, e.g. 'assessment'
scoreScaled - score acheived, from 0.0 to 1.0 - optional
scoreRaw - the score in points acheived - optional
scoreMin - the minimum possible score in points (usually 0) - optional
scoreMax  - the maximum possible score in points - optional

returns the statement as a JSON string

*/
function CreateStatement(language, actorName, actorEmail, actorEmailHash, verb, activityName, activityDescription, activityId, activityType, scoreScaled, scoreRaw, scoreMin, scoreMax, response) {

    var _language = "en-US";

    if ((typeof language != "undefined") && (language != "")) {
        _language = language;
    }

    if ((typeof activityId == "undefined") || (activityId == "")) {
        activityId = window.location.href.removeHash();
    }

    if ((typeof activityType == "undefined") || (activityType == "")) {
        activityType = "http://adlnet.gov/expapi/activities/media";
    }

    var _statement = new Statement();

    if (getNotNullOrBlank(actorEmail)) {
        if (actorEmail.indexOf("mailto:") == -1) {
            _statement.actor.mbox = "mailto:" + actorEmail;
        }
    } else {
        _statement.actor.mbox = null;
        _statement.actor.account = new Object();
        _statement.actor.account.name = actorName;
        _statement.actor.account.homePage = window.location.protocol + "//" + window.location.host;

    }

    _statement.actor.name = actorName;

    _statement.verb.display[_language] = verb;
    _statement.verb.id = getVerbId(verb);

    _statement.object.id = activityId;
    _statement.object.definition.type = activityType;
    _statement.object.definition.name[_language] = activityName;
    _statement.object.definition.description[_language] = activityDescription;

    _statement.result.success = true;
    _statement.result.completion = true;
    _statement.result.setScore(scoreScaled, scoreRaw, scoreMin, scoreMax);

    if (getNotNullOrBlank(response)) {
        _statement.result.response = response;
    }


    return _statement.getJSON();
}


/* *******************************************
Make a call to XPoint

endpoint - the URL of XPoint, e.g. "http://xpoint.questionmark.com/public/statements/"
query - additional path and query string, e.g. "?$top=25"
method - HTTP method : GET, POST, PUT or DELETE
version - version of XAPI being used
data - any data to be sent (with POST or PUT)
resultHandler - function to handle the response form the lRS
user - the name of the user (can be the same as the account name)
password - the user password or account authentication key

*/
function callERS(endpoint, query, method, version, data, resultHandler, user, password) {
    $.support.cors = true;

    $.ajax({
        type: method,
        url: endpoint + query,
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        data: data,
        beforeSend: function (xhr) {
            xhr.setRequestHeader('X-Experience-API-Version', version);
            if (getNotNullOrBlank(password)) {
                xhr.setRequestHeader('Authorization', getBasicAuthHeader(user, password));
            }
        },

        success: function (res) {
            resultHandler(res);
        },

        error: function (xhr, status, error) {
            if (window.console) {
                console.log("Error " + xhr.status + " : " + xhr.statusText);
            } else {
                alert("Error " + xhr.status + " : " + xhr.statusText);
            }
        }

    });
}


/* *******************************************
Send a statement to XPoint using JSONP

endpoint - the URL of XPoint JSONP handler, e.g. "http://xpoint.questionmark.com/public/notify/"
statement - the statement to submit in JSON
resultHandler - function to handle the response form the lRS
user - the name of the user (can be the same as the account name)
password - the user password or account authentication key

*/
function sendStatement(endpoint, statement, resultHandler, user, password) {
 
    var authstring = "Basic " + Base64(user + ':' + password);

    var url = endpoint + "?" + "Authorization=" + escape(authstring) + "&" + "statement=" + encodeURIComponent(statement);  

    $.ajax({
        type: 'GET',
        url: url,
        async: false,
        contentType: "application/json",
        dataType: 'jsonp',
        success: function (res) {
            resultHandler(res);
        }
    });

}

/* *******************************************
write a rating control to get a numeric rating from the user and submit a rating statement

unRatedTitle - the title of the rating control before rating, e.g. "Rate this page"
ratedTitle  - the title of the rating control after rating, e.g. "This page has been rated"
ratings - an array of possible ratings
onImage - URL of image to use for selected rating
offImage - URL of image to use for selected rating
submitFunction - function to call to submit the rating statement
userName - name of the current user if known
activity - the name of the actvity being rated

Must be preceeded by HTML places holders as follows :
<span id="rateTitle"></span>
<div id="rating" class="rating">
<span id="rateText"></span>
</div>

*/

// internal variables used by rating control
var g_isRated = false;
var g_unrateTitle
var g_rateTitle;
var g_rateArray;
var g_rateImage;
var g_unrateImage;
var g_submitRatingFunction;
var g_ratingUserName;
var g_ratingActivity;

function WriteRating(unRatedTitle, ratedTitle, ratings, onImage, offImage, submitFunction, userName, activity) {

    g_unrateTitle = unRatedTitle;
    g_rateTitle = ratedTitle;
    g_rateArray = ratings;
    g_rateImage = onImage;
    g_unrateImage = offImage;

    g_submitRatingFunction = submitFunction;
    g_ratingUserName = userName;
    g_ratingActivity = activity;

    $('#rateTitle').html(g_unrateTitle);

    for (i = 0; i < g_rateArray.length; i++) {
        $('#rating').append('<div id="rate' + (i + 1) + '" class="rate"><a id="' + (i + 1) + '">' + (i + 1) + '</a></div>');
    }

    for (i = 1; i <= g_rateArray.length; i++) {
        $('#rate' + i).css({ background: 'url("' + g_unrateImage + '") no-repeat scroll 0 0 transparent' });
    }

    $('.rate a').hover(function () {
        if (g_isRated) return;

        for (i = 1; i <= this.id; i++) {
            $('#rate' + i).css({ background: 'url("' + g_rateImage + '")' });
        }
        $('#rateText').css('visibility', "visible");
        $('#rateText').html('&nbsp;' + g_rateArray[this.id - 1]);

    });

    $('.rate a').mouseout(function () {

        if (g_isRated) {
            return;
        } else {
            $('#rateText').css({ visibility: "hidden" });
            for (i = 1; i <= g_rateArray.length; i++) {
                $('#rate' + i).css({ background: 'url("' + g_unrateImage + '")' });
            }

        }
    });

    $('.rate a').click(function () {
        if (g_isRated) return;
        g_isRated = true;

        // hide the control
        $("#rating").fadeOut(300);
        $('#rateTitle').fadeOut(300, function () { $('#rateTitle').html(g_rateTitle); });

        // get rating as integer
        var ratingValue = parseInt($(this).text());

        // remove unrated stars
        $('#rating').css({ cursor: 'default' });
        for (i = ratingValue + 1; i <= g_rateArray.length; i++) {
            $('#rate' + i).css({ background: 'none' });
        }
       
        // submit the statements
        g_submitRatingFunction(ratingValue, g_rateArray.length, g_ratingUserName, g_ratingActivity);

        // show it again
        $("#rating").fadeIn();
        $('#rateTitle').fadeIn();
    });
}

/* statement elements */
function Actor() {
    this.objectType = "Agent";
}

function Verb(language) {
    this.display = new Object();

}

function _Object(language) {
    this.objectType = "Activity";
    this.definition = new Definition(language);
}


function Definition(language) {
    this.type = "";
    this.name = new Object();

    this.description = new Object();

}

function Result() {
    this.success = false;
    this.completion = false;
}

Result.prototype.setScore = function (scoreScaled, scoreRaw, scoreMin, scoreMax) {

    if ((typeof scoreScaled != "undefined") && (scoreScaled != "") ||
    (typeof scoreRaw != "undefined") && (scoreRaw != "") ||
    (typeof scoreMin != "undefined") && (scoreMin != "") ||
    (typeof scoreMax != "undefined") && (scoreMax != "")) {
        this.score = new Object();

        if ((typeof scoreScaled != "undefined") && (scoreScaled != "")) {
            this.score.scaled = scoreScaled;
        }
        if ((typeof scoreRaw != "undefined") && (scoreRaw != "")) {
            this.score.raw = scoreRaw;
        }
        if ((typeof scoreMin != "undefined") && (scoreMin != "")) {
            this.score.min = scoreMin;
        }
        if ((typeof scoreMax != "undefined") && (scoreMax != "")) {
            this.score.max = scoreMax;
        }
    }
}

function Statement(language) {

    this.actor = new Actor();

    this.verb = new Verb();

    this.object = new _Object();
        
    this.result = new Result();

}

Statement.prototype.getJSON = function () {
    return JSON.stringify(this, null, 4);
}

var ADL_VERBS = ["experienced", "attended", "attempted", "completed", "passed", "failed", "answered", "interacted", "imported", "created", "shared", "voided"];
var ADL_VERB_URI = "http://adlnet.gov/expapi/verbs/";
var QUESTIONMARK_VERB_URI = "http://questionmark.com/expapi/verbs/";



function ArrayContainsItem(theArray, theItem) {
    var i = theArray.length;
    while (i--) {
        if (theArray[i] == theItem) {
            return true;
        }
    }
    return false;
}

function getVerbId(verb) {

    var verbId = verb;

    if (ArrayContainsItem(ADL_VERBS,verb)) {
        verbId = ADL_VERB_URI + verb;
    } else {
        verbId = QUESTIONMARK_VERB_URI + verb;
    }

    return verbId;
        
}


/* various utility functions */

function getNotNullOrBlank(obj) {
    return ((typeof obj != "undefined") && (obj != ""));
}

function getBasicAuthHeader(user, password) {
  var clear = user + ':' + password;

  var hash = Base64(clear);
  return "Basic " + hash;
}



/* String truncate with ellipsis */
String.prototype.trunc = function (value) {
    return this.substr(0, value - 1) + (this.length > value ? '...' : '');
};

/* string contains substring test */
String.prototype.contains = function (it) {
    return this.indexOf(it) != -1;
};

/* remove '#' and everything following it from end of string */
String.prototype.removeHash = function () {
    var parts = this.split('#');
    return parts[0];
};
// Base64 encoding

var _PADCHAR = "=",
    _ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
    _VERSION = "1.0";


function _getbyte64(s, i) {
    return _ALPHA.indexOf(s.charAt(i));
}

function _getbyte(s, i) {
    return s.charCodeAt(i);
}

function Base64(s) {
 
    s = String(s);

    var i,
      b10,
      x = [],
      imax = s.length - s.length % 3;

    if (s.length === 0) {
        return s;
    }

    for (i = 0; i < imax; i += 3) {
        b10 = (_getbyte(s, i) << 16) | (_getbyte(s, i + 1) << 8) | _getbyte(s, i + 2);
        x.push(_ALPHA.charAt(b10 >> 18));
        x.push(_ALPHA.charAt((b10 >> 12) & 0x3F));
        x.push(_ALPHA.charAt((b10 >> 6) & 0x3f));
        x.push(_ALPHA.charAt(b10 & 0x3f));
    }

    switch (s.length - imax) {
        case 1:
            b10 = _getbyte(s, i) << 16;
            x.push(_ALPHA.charAt(b10 >> 18) + _ALPHA.charAt((b10 >> 12) & 0x3F) + _PADCHAR + _PADCHAR);
            break;

        case 2:
            b10 = (_getbyte(s, i) << 16) | (_getbyte(s, i + 1) << 8);
            x.push(_ALPHA.charAt(b10 >> 18) + _ALPHA.charAt((b10 >> 12) & 0x3F) + _ALPHA.charAt((b10 >> 6) & 0x3f) + _PADCHAR);
            break;
    }

    return x.join("");
}


//  Secure Hash Algorithm (SHA1)

function SHA1(msg) {

    function rotate_left(n, s) {
        var t4 = (n << s) | (n >>> (32 - s));
        return t4;
    };

    function lsb_hex(val) {
        var str = "";
        var i;
        var vh;
        var vl;

        for (i = 0; i <= 6; i += 2) {
            vh = (val >>> (i * 4 + 4)) & 0x0f;
            vl = (val >>> (i * 4)) & 0x0f;
            str += vh.toString(16) + vl.toString(16);
        }
        return str;
    };

    function cvt_hex(val) {
        var str = "";
        var i;
        var v;

        for (i = 7; i >= 0; i--) {
            v = (val >>> (i * 4)) & 0x0f;
            str += v.toString(16);
        }
        return str;
    };


    function Utf8Encode(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            }
            else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            }
            else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    };

    var blockstart;
    var i, j;
    var W = new Array(80);
    var H0 = 0x67452301;
    var H1 = 0xEFCDAB89;
    var H2 = 0x98BADCFE;
    var H3 = 0x10325476;
    var H4 = 0xC3D2E1F0;
    var A, B, C, D, E;
    var temp;

    msg = Utf8Encode(msg);

    var msg_len = msg.length;

    var word_array = new Array();
    for (i = 0; i < msg_len - 3; i += 4) {
        j = msg.charCodeAt(i) << 24 | msg.charCodeAt(i + 1) << 16 |
		msg.charCodeAt(i + 2) << 8 | msg.charCodeAt(i + 3);
        word_array.push(j);
    }

    switch (msg_len % 4) {
        case 0:
            i = 0x080000000;
            break;
        case 1:
            i = msg.charCodeAt(msg_len - 1) << 24 | 0x0800000;
            break;

        case 2:
            i = msg.charCodeAt(msg_len - 2) << 24 | msg.charCodeAt(msg_len - 1) << 16 | 0x08000;
            break;

        case 3:
            i = msg.charCodeAt(msg_len - 3) << 24 | msg.charCodeAt(msg_len - 2) << 16 | msg.charCodeAt(msg_len - 1) << 8 | 0x80;
            break;
    }

    word_array.push(i);

    while ((word_array.length % 16) != 14) word_array.push(0);

    word_array.push(msg_len >>> 29);
    word_array.push((msg_len << 3) & 0x0ffffffff);


    for (blockstart = 0; blockstart < word_array.length; blockstart += 16) {

        for (i = 0; i < 16; i++) W[i] = word_array[blockstart + i];
        for (i = 16; i <= 79; i++) W[i] = rotate_left(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);

        A = H0;
        B = H1;
        C = H2;
        D = H3;
        E = H4;

        for (i = 0; i <= 19; i++) {
            temp = (rotate_left(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }

        for (i = 20; i <= 39; i++) {
            temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }

        for (i = 40; i <= 59; i++) {
            temp = (rotate_left(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }

        for (i = 60; i <= 79; i++) {
            temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
            E = D;
            D = C;
            C = rotate_left(B, 30);
            B = A;
            A = temp;
        }

        H0 = (H0 + A) & 0x0ffffffff;
        H1 = (H1 + B) & 0x0ffffffff;
        H2 = (H2 + C) & 0x0ffffffff;
        H3 = (H3 + D) & 0x0ffffffff;
        H4 = (H4 + E) & 0x0ffffffff;

    }

    var temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);

    return temp.toLowerCase();

}



