const moment = require('moment');
const router = require('express').Router();
const paypal = require('../paypalAPI');
const calendar = require('../calendarAPI');
const utils = require('../utils');
const {Reservation, Venue} = require('../models');


function write_reservation_to_calendar(reservation) {
    const rooms = reservation.rooms.map(room => room.name).join(', ');
    calendar.addEvent({
        start:   {dateTime: utils.momentToCalendarDate(moment(reservation.start)), timeZone: 'Europe/London'},
        end:     {dateTime: utils.momentToCalendarDate(moment(reservation.end)),   timeZone: 'Europe/London'},
        summary: reservation.venue,
        description: [
            `Rooms: ${rooms}`,
            `Name: ${reservation.customer.name}`,
            `Phone Number: ${reservation.customer.phone_number}`,
            `Payment ID: ${reservation.payment.id}`,
        ].join('\n'),
    }).catch(err => {
        console.error("Cannot create calendar entry:")
        console.error(err);
    });
}


router.get('/ok', (req, res) => {
    // expect token, paymentId, and PayerID.
    const { paymentId, PayerID, token } = req.query;
    if (!(paymentId && PayerID && token)) {
        res.status(403);
        res.end();
        return;
    }

    let reservation = null;
    Reservation.find_payment({'payment.id': paymentId, 'payment.token': token}).
        then(_reservation => {
            if (!_reservation) throw new utils.StatusError(400);
            reservation = _reservation;
        }).
        // ensure that the reservation is unique; if it's not unique then there
        // is potentially two people paying at once.
        then(() => reservation.ensure_unique()).
        then(() => new Promise((resolve, reject) => paypal.execute_payment(paymentId, PayerID, (err, payment) => {
                if (err) return reject(err);
                resolve(payment);
            }))).
        then(() => {
            reservation.confirmed = true;
            return reservation.save();
        }).
        then(() => {
            write_reservation_to_calendar(reservation);
            res.cookie('reservation', JSON.stringify({
                venue:     reservation.venue,
                rooms:     reservation.rooms.map(x => x.name).join(', '),
                start:     reservation.start,
                end:       reservation.end,
                customer:  reservation.customer,
                paypal_id: reservation.payment.id,
            }));
            res.redirect('/payment-confirmed');
        }).
        catch(err => {
            if (err.IntegrityError) {
                reservation.remove(() => {});
                res.redirect('/payment-retry');
                return;
            }
            utils.catch_errors(res)(err);
        });
});


router.get('/cancel', (req, res) => {
    // expect token
    const {token} = req.query;
    if (!token) {
        res.status(403);
        res.end();
        return;
    }
    // find + delete reservation
    Reservation.cancel_payment(token).
        then(() => res.redirect('/payment-cancelled')).
        catch(utils.catch_errors(res));
});


module.exports = router;
