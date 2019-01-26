const moment = require('moment');
const router = require('express').Router();
const utils = require('../utils');
const calendar = require('../calendarAPI');
const paypal = require('../paypalAPI');
const booking_info = require('../booking_info');


router.get('/taken', (req, res) => {
    const venue = req.body.venue;
    const start = moment();
    const end   = start.clone().add(31, 'days');

    if (!venue || !booking_info.is_valid_venue(venue)) {
        res.status(400).end();
        return;
    }

    const query = {
        start: utils.momentToCalendarDate(start),
        end:   utils.momentToCalendarDate(end),
        predicate: (event) => event.summary === venue,
    };

    Promise.all([
        calendar.listLocks(query),
        calendar.listSlots(query),
    ])
        .then(([locks, events]) => {
            res.json(locks.concat(events).map(x => [x.start.dateTime, x.end.dateTime]))
        })
        .catch(err => { throw err; });
});


router.post('/', (req, res) => {
    const venue   = req.body.venue;
    const start   = utils.clientDateToMoment(req.body.start);
    const end     = utils.clientDateToMoment(req.body.end);
    const details = {
        name:  req.body.name,
        phone_number: req.body.phone_number,
    };

    // sanity checks
    if (!start.isAfter(moment())
        || !end.isAfter(start)
        || end.diff(start, 'days') > 0
        || start.diff(moment(), 'days') > 31
        || !details.name
        || !details.phone_number
        || !venue
        || !booking_info.is_valid_venue(venue)
        || !booking_info.within_opening_hours(venue, start)
        || !booking_info.within_opening_hours(venue, end)) {
        res.status(400).end();
        return;
    }

    const price = booking_info.get_price(venue, end.diff(start, 'minutes') / 60).toPrecision(2);
    const start_date = utils.momentToCalendarDate(start);
    const end_date   = utils.momentToCalendarDate(end);
    const query = {
        start: start_date,
        end:   end_date,
        predicate: (event) => event.summary === venue,
    };

    // check if someone else is trying to book the same slot, or if
    // the slot is already booked.
    Promise.all([
        calendar.findLock(query),
        calendar.findSlot(query),
    ]).then(([lock, slot]) => {
        if (lock || slot) {
            res.status(400).end();
            return;
        }
        paypal.create_payment(`${venue} (${duration/2} hours)`, price, (err, payment, info) => {
            if (err) throw err;
            calendar.addLock({
                start:   {dateTime: start_date, timeZone: 'Europe/London'},
                end:     {dateTime: end_date,   timeZone: 'Europe/London'},
                summary: venue,
                description: JSON.stringify({
                    payment_id: payment.id,
                    token:      info.token,
                    details:    details,
                }),
            }).then(_ => res.redirect(info.redirect))
              .catch(err => { throw err; });
        });
    }).catch(err => {
        throw err;
    });
});


module.exports = router;
