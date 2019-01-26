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
function addEvent(calendarId, resource) {
    return calendar.events.insert({
        calendarId,
        auth: AUTH,
        resource,
    });
}


function deleteEvent(calendarId, eventId) {
    return calendar.events.delete({
        calendarId,
        auth: AUTH,
        eventId,
    });
}


function listEvents(calendarId, query) {
    const pred = query.predicate || (() => true);
    return new Promise((resolve, reject) => {
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
                reject(err);
                return;
            }
            events = events.concat(res.data.items);
            if (res.data.nextPageToken) {
                params.pageToken = res.data.nextPageToken;
                loop();
            } else {
                resolve(events.filter(pred));
            }
        });
        loop();
    });
}


function augment_lock_query(query) {
    const q2 = Object.assign({}, query);
    const og = query.predicate || (() => true);
    const timeout = moment().subtract(15, 'minutes');
    q2.predicate = (event) =>
        moment(event.updated).isAfter(timeout) &&
            og(event, JSON.parse(event.description));
    return q2;
}


function findFirst(calendarId, query) {
    const pred = query.predicate || (() => true);
    return listEvents(calendarId, query).then(events => events.find(e => pred(e)));
}


module.exports = {
    PAYPAL_ID,
    MAIN_ID,
    addLock:    (resource) => addEvent(PAYPAL_ID, resource),
    addSlot:    (resource) => addEvent(MAIN_ID, resource),
    deleteLock: (eventId) => deleteEvent(PAYPAL_ID, eventId),
    listLocks:  (query) => listEvents(PAYPAL_ID, augment_lock_query(query)),
    listSlots:  (query) => listEvents(MAIN_ID, query),
    findLock:   (query) => findFirst(PAYPAL_ID, augment_lock_query(query)),
    findSlot:   (query) => findFirst(MAIN_ID, query),
};
