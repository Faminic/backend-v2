const process = require('process');
const {Venue} = require('./app/models');
const {createCalendar} = require('./app/calendarAPI.js');

Venue.find({}).
    then(venues => Promise.all(venues.map(venue => {
        return createCalendar(venue.name).
            then(calendarId => {
                venue.calendarId = calendarId;
                return venue.save();
            });
     }))).
    then(() => process.exit());
