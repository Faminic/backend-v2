const moment = require('moment');
const router = require('express').Router();
const paypal = require('../paypalAPI');
const calendar = require('../calendarAPI');
const utils = require('../utils');
const email = require('../email');
const {Reservation, Venue} = require('../models');


function send_reservation_email(reservation) {
    const rooms = reservation.rooms.map(room => room.name).join(', ');
    email({
        from: "durhamredthunder2018@gmail.com",
        to:   "durhamredthunder2018@gmail.com",
        subject: "Automated Booking",
        html: `
        <table>
        <tr><th>Venue:</th><td>${reservation.venue}</td></tr>
        <tr><th>Rooms:</th><td>${rooms}</td></tr>
        <tr><th>Name:</th><td>${reservation.customer.name}</td></tr>
        <tr><th>Phone Number:</th><td>${reservation.customer.phone_number}</td></tr>
        <tr><th>Start:</th><td>${reservation.start}</td></tr>
        <tr><th>End:</th><td>${reservation.end}</td></tr>
        <tr><th>PayPal ID:</th><td><code>${reservation.payment.id}</code></td></tr>
        </table>`
    });
}


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
            send_reservation_email(reservation);
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
