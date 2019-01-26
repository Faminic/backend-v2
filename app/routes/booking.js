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

    const start_date = utils.momentToCalendarDate(start);
    const end_date = utils.momentToCalendarDate(end);
    let times = [];

    calendar.listEvents(calendar.PAYPAL_ID, {
        start: start_date,
        end:   end_date,
        predicate: (event) => event.summary === venue,
    }, (err, locks) => {
        if (err) throw err;
        times = times.concat(locks.map(x => [x.start.dateTime, x.end.dateTime]));
        calendar.listEvents(calendar.MAIN_ID, {
            start: start_date,
            end:   end_date,
            predicate: (event) => event.summary === venue,
        }, (err, events) => {
            if (err) throw err;
            times = times.concat(events.map(x => [x.start.dateTime, x.end.dateTime]));
            res.json(times);
        });
    });
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

    const duration = end.diff(start, 'minutes') / 30;
    const price = (booking_info.get_price(venue) * duration).toString() + ".00";

    const start_date = utils.momentToCalendarDate(start);
    const end_date   = utils.momentToCalendarDate(end);

    // check first if someone else is trying to book
    // the same slot.
    calendar.findLock({
        start: start_date,
        end:   end_date,
        predicate: (event) => event.summary === venue,
    }, (err, event) => {
        if (err) throw err;
        if (event) return res.status(400).end();
        // now check if there is a booking in place
        calendar.findSlot({
            start: start_date,
            end:   end_date,
            predicate: (event) => event.summary === venue,
        }, (err, event) => {
            if (err) throw err;
            if (event) return res.status(400).end();
            // ok, lock + redirect to payment
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
                }, err => {
                    if (err) throw err;
                    res.redirect(info.redirect);
                });
            });
        });
    });
});


module.exports = router;
