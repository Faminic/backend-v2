const {google} = require('googleapis');
const moment = require('moment');
const calendar = google.calendar('v3');
const privatekey = require('./keys/privatekey.json');

const PAYPAL_ID = '1mlpohc4b7q3ujqvpndg27vna4@group.calendar.google.com'; // paypal calendar
const MAIN_ID   = 'durhamredthunder2018@gmail.com'; // main calendar


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
        calendar.calendarList.list({auth: jwtClient}, (a, b) => {
            b.data.items.forEach(cal => console.log(cal.id, cal.summary));
        });
    });

    return jwtClient;
}

const AUTH = connect();

// resource can have start, end, summary, description and id
// start and end should be like:
//   { dateTime: 'string', timeZone: 'string' }
function addEvent(calendarId, resource, callback) {
    calendar.events.insert({
        calendarId,
        auth: AUTH,
        resource,
    }, callback);
}


function deleteEvent(calendarId, eventId, callback) {
    calendar.events.delete({
        calendarId,
        auth: AUTH,
        eventId,
    }, callback);
}


function listEvents(calendarId, query, callback) {
    let events = [];
    let params = {
        calendarId,
        auth: AUTH,
        timeMin: query.start,
        timeMax: query.end,
        maxResults: 2500,
    };
    const loop = () => calendar.events.list(params, (err, res) => {
        if (err) {
            callback(err, events);
            return;
        }
        events = events.concat(res.data.items);
        if (res.data.nextPageToken) {
            params.pageToken = res.data.nextPageToken;
            loop();
        } else {
            callback(null, events);
        }
    });
    loop();
}


function findLock(query, callback) {
    const og = query.predicate || (() => true);
    const timeout = moment().subtract(15, 'minutes');
    query.predicate = (event) =>
        moment(event.updated).isAfter(timeout) &&
            og(event, JSON.parse(event.description));
    return findFirst(PAYPAL_ID, query, callback);
}


function findSlot(query, callback) {
    return findFirst(MAIN_ID, query, callback);
}


function findFirst(calendarId, query, callback) {
    query.predicate = query.predicate || (() => true);
    listEvents(calendarId, query, (err, events) => {
        if (err) {
            callback(err, null);
            return;
        }
        const event = events.find((event) => query.predicate(event));
        callback(null, event);
    });
}

module.exports = {
    PAYPAL_ID,
    findLock,
    findSlot,
    addLock: (resource, callback) => addEvent(PAYPAL_ID, resource, callback),
    addSlot: (resource, callback) => addEvent(MAIN_ID, resource, callback),
    deleteLock: (eventId, callback) => deleteEvent(PAYPAL_ID, eventId, callback),
    listEvents,
};
