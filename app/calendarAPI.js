const moment = require('moment');
const {google} = require('googleapis');
const calendar = google.calendar('v3');
const {momentToCalendarDate} = require('./utils');
const privatekey = require('./keys/privatekey.json');


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
function addEvent(calendarId, resource) {
    return calendar.events.insert({
        calendarId,
        auth,
        resource,
    });
}


function deleteEvent(calendarId, eventId) {
    return calendar.events.delete({
        calendarId,
        auth,
        eventId,
    });
}


function createCalendar(summary) {
    // Create calendar with given name and share it with the default
    // user so PVCC can view/edit events.
    let calendarId = null;
    return calendar.calendars.insert({
        auth,
        requestBody: {
            summary,
            timeZone: 'Europe/London',
        },
    }).
        then(r => { calendarId = r.data.id; }).
        then(_ => calendar.acl.insert({
            auth,
            calendarId,
            requestBody: {
                role: 'owner',
                scope: {
                    type:  'user',
                    value: 'durhamredthunder2018@gmail.com'
                },
            },
        })).
        then(_ => calendarId);
}


function addReservationEvent(reservation) {
    // reservation: a confirmed Reservation object
    const rooms = reservation.rooms.map(room => room.name).join(', ');
    addEvent(reservation.calendarId, {
        start:   { dateTime: momentToCalendarDate(moment(reservation.start)), timeZone: 'Europe/London' },
        end:     { dateTime: momentToCalendarDate(moment(reservation.end)),   timeZone: 'Europe/London' },
        summary: reservation.venue,
        description: [
            `Rooms: ${rooms}`,
            `Name: ${reservation.customer.name}`,
            `Phone Number: ${reservation.customer.phone_number}`,
            `Payment ID: ${reservation.payment.id}`,
        ].join('\n'),
    }).then(res => {
        reservation.eventId = res.data.id;
        return reservation.save();
    }).catch(err => {
        console.error("Cannot create calendar entry:")
        console.error(err);
    });
}


module.exports = {
    addEvent,
    deleteEvent,
    addReservationEvent,
    createCalendar,
    auth,
};
