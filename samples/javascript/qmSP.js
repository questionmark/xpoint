
/* *******************************************
Submit a simple statement to XPoint using the Sharepoint login name
<actor> <verb> <object>
userField - the Sharepoint user property to identify the person the statement concerns
    can be "title", "email", "login" or "id"
verb - what the person did, see http://tincanapi.wikispaces.com/ADL+Experience+API+Companion+Document
object - the name of activity the statement concerns
e.g.
<John> <completed> <safety training>

SubmitSPUserStatement("title","viewed", document.title);

Uses settings from qmERS.config.js or equivalent for endpoint URL, user name, password etc
*/
function SubmitSPUserStatement(userField, verb, object) {
    ExecuteOrDelayUntilScriptLoaded(function () { SPUserStatement(userField, verb, object); }, "sp.js");
}


// globals used for Sharepoint calls
var web;
var context;
var user;


function SPUserStatement(userField, verb, object) {
    context = SP.ClientContext.get_current();
    web = context.get_web();
    user = web.get_currentUser(); 
    context.load(user); 
    context.executeQueryAsync(function (sender, args) { GetUserViewedSuccess(userField, verb, object); }, GetUserFailed);
}

function GetUserViewedSuccess(userField, verb, object) {
    NotifyStatement(GetNameFromUser(userField), verb, object);
}

function SubmitSPUserRatedStatement(rating, max, userField, object) {
    ExecuteOrDelayUntilScriptLoaded(function () { SPUserRatedStatement(userField, "rated", object, rating, max); }, "sp.js");
}

function SPUserRatedStatement(userField, verb, object, rating, max) {
    context = SP.ClientContext.get_current();
    web = context.get_web();
    user = web.get_currentUser();
    context.load(user);
    context.executeQueryAsync(function (sender, args) { GetUserRatedSuccess(userField, verb, object, rating, max); }, GetUserFailed);
}

function GetUserRatedSuccess(userField, verb, object, rating, max) {
    NotifyRating(GetNameFromUser(userField), verb, object, rating, max)
}

function SubmitSPUserCommentStatement(userField, object, comment) {
    ExecuteOrDelayUntilScriptLoaded(function () { SPUserCommentStatement(userField, "commented", object, comment); }, "sp.js");
}

function SPUserCommentStatement(userField, verb, object, comment) {
    context = SP.ClientContext.get_current();
    web = context.get_web();
    user = web.get_currentUser();
    context.load(user);
    context.executeQueryAsync(function (sender, args) { GetUserCommentSuccess(userField, verb, object, comment); }, GetUserFailed);
}

function GetUserCommentSuccess(userField, verb, object, comment) {
    NotifyComment(GetNameFromUser(userField), verb, object, comment)
}


function GetUserFailed(sender, args) {
    alert('error: ' + args.get_message() + '\n' + args.get_stackTrace());
}

function GetNameFromUser(field) {
    var userName = "Unknown";

    switch (field) {
        case "title":
            userName = user.get_title();
            break;
        case "id":
            userName = user.get_id();
            break;
        case "login":
            userName = user.get_loginName();
            break;
        case "email":
            userName = user.get_email();
            break;
        default:
            userName = "Unknown";
    }

    return userName;
}


