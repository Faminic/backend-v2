const {google} = require('googleapis');
const calendar = google.calendar('v3');
const privatekey = require('./keys/privatekey.json');
const MAIN_ID = 'durhamredthunder2018@gmail.com'; // main calendar


function connect() {
    let jwtClient = new google.auth.JWT(
        privatekey.client_email,
        null,
        privatekey.private_key,
        ['https://www.googleapis.com/auth/calendar']
    );

    jwtClient.authorize((err, tokens) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log('API access authenticated');
    });

    return jwtClient;
}

const auth = connect();

// resource can have start, end, summary, description and id
// start and end should be like:
//   { dateTime: 'string', timeZone: 'string' }
function addEvent(resource) {
    return calendar.events.insert({
        calendarId: MAIN_ID,
        auth,
        resource,
    });
}


module.exports = {
    addEvent,
};
