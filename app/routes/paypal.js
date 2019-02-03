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

    Reservation.find_payment({'payment.id': paymentId, 'payment.token': token}).then(reservation => {
        // make sure that the reservation still exists
        if (!reservation) {
            res.status(400);
            res.end();
            return;
        }
        return new Promise((resolve, reject) => {
            paypal.execute_payment(paymentId, PayerID, (err, payment) => {
                if (err) return reject(err);
                console.log(payment);
                reservation.confirmed = true;
                reservation.save((err) => {
                    if (err) return reject(err);
                    write_reservation_to_calendar(reservation);
                    res.write("Payment approved.");
                    res.end();
                    resolve();
                });
            });
        });
    })
    .catch(err => {
        console.error(err);
        res.status(500);
        res.end();
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
        then(() => {
            res.write("Payment cancelled");
            res.end();
        }).
        catch(err => {
            console.error(err);
            res.status(500);
            res.end();
        });
});


module.exports = router;
