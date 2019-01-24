const moment = require('moment');
const router = require('express').Router();
const utils = require('../utils');
const calendar = require('../calendarAPI');
const paypal = require('../paypalAPI');
const booking_info = require('../booking_info');


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
        || !calendar.ids[venue]
        || !booking_info.within_closing_times(venue, start)
        || !booking_info.within_closing_times(venue, end)) {
        res.status(400).end();
        return;
    }

    // TODO: price lists
    const duration = end.diff(start, 'minutes') / 30;
    const price = (10 * duration).toString() + ".00";

    const start_date = utils.momentToCalendarDate(start);
    const end_date   = utils.momentToCalendarDate(end);

    // check first if someone else is trying to book
    // the same slot.
    calendar.findLock(calendar.auth, {
        start: start_date,
        end:   end_date,
        predicate: (event) => event.summary === venue,
    }, (err, event) => {
        if (err) throw err;
        if (event) {
            res.status(400).end();
            return;
        }
        // now check if there is a booking in place
        calendar.findFirst(calendar.ids[venue], calendar.auth, {
            start: start_date,
            end:   end_date,
        }, (err, event) => {
            if (err) throw err;
            if (event) return res.status(400).end();
            // ok, lock + redirect to payment
            paypal.create_payment(`${venue} (${duration/2} hours)`, price, (err, payment, info) => {
                if (err) throw err;
                calendar.addLock(calendar.auth, {
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
