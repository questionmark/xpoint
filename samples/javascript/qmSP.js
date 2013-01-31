
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

// name to use for unknown users
var UnknownUserName = "Unknown";

// globals used for Sharepoint calls
var web;
var context;
var user;

function SubmitSPUserStatement(userField, verb, object) {
    ExecuteOrDelayUntilScriptLoaded(function () { SPUserStatement(userField, verb, object); }, "sp.js");
}

function SPUserStatement(userField, verb, object) {
    try {
        context = SP.ClientContext.get_current();
        web = context.get_web();
        user = web.get_currentUser(); 
        context.load(user); 
        context.executeQueryAsync(function (sender, args) { GetUserViewedSuccess(userField, verb, object); }, function (sender, args) { NotifyStatement(UnknownUserName, verb, object); });
    }
    catch (e) {
        NotifyStatement(UnknownUserName, verb, object);
    }
}

function GetUserViewedSuccess(userField, verb, object) {
    NotifyStatement(GetNameFromUser(userField), verb, object);
}

function SubmitSPUserRatedStatement(rating, max, userField, object) {
    ExecuteOrDelayUntilScriptLoaded(function () { SPUserRatedStatement(userField, "rated", object, rating, max); }, "sp.js");
}

function SPUserRatedStatement(userField, verb, object, rating, max) {

    try {
        context = SP.ClientContext.get_current();
        web = context.get_web();
        user = web.get_currentUser();
        context.load(user);
        context.executeQueryAsync(function (sender, args) { GetUserRatedSuccess(userField, verb, object, rating, max); }, function (sender, args) { NotifyRating(UnknownUserName, verb, object, rating, max); });
    }
    catch (e) {

    }

}

function GetUserRatedSuccess(userField, verb, object, rating, max) {
    NotifyRating(GetNameFromUser(userField), verb, object, rating, max)
}

function SubmitSPUserCommentStatement(userField, object, comment) {
    ExecuteOrDelayUntilScriptLoaded(function () { SPUserCommentStatement(userField, "commented", object, comment); }, "sp.js");
}

function SPUserCommentStatement(userField, verb, object, comment) {
    try {
        context = SP.ClientContext.get_current();
        web = context.get_web();
        user = web.get_currentUser();
        context.load(user);
        context.executeQueryAsync(function (sender, args) { GetUserCommentSuccess(userField, verb, object, comment); }, function (sender, args) { NotifyComment(UnknownUserName, verb, object, comment); });
    }
    catch(e) {

    }
}

function GetUserCommentSuccess(userField, verb, object, comment) {
    NotifyComment(GetNameFromUser(userField), verb, object, comment)
}



function GetNameFromUser(field) {
    var userName = UnknownUserName;

    try {
        if (getNotNullOrBlank(user)) {
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
                    userName = UnknownUserName;
            }
        }
    }
    catch(e) {
    }

    return userName;
}


