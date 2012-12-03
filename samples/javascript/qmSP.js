
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
    context.executeQueryAsync(function (sender, args) { GetUserSuccess(userField, verb, object); }, GetUserFailed);
}

function GetUserSuccess(userField, verb, object) {
    var userName = "Unknown";

    switch (userField) {
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
    NotifyStatement(userName, verb, object);
}

function GetUserFailed(sender, args) {
    alert('error: ' + args.get_message() + '\n' + args.get_stackTrace());
}




