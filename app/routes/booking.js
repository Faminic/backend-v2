const moment = require('moment');
const router = require('express').Router();
const utils = require('../utils');
const paypal = require('../paypalAPI');
const booking_info = require('../booking_info');
const {Venue, Reservation} = require('../models');


router.get('/', (req, res) => {
    Venue.find({}).
        then(docs => res.json(docs)).
        catch(err => {
            console.error(err);
            res.status(500);
            res.end();
        });
});


router.get('/taken/:venue_id/:product_id', (req, res) => {
    const venue_id   = req.params.venue_id;
    const product_id = req.params.product_id;
    // sanity check
    if (!venue_id || !product_id) {
        res.status(400).end();
        return;
    }
    Venue.findById(venue_id).
        then(venue => {
            if (!venue) return Promise.reject();
            const product = venue.get_product(product_id);
            if (!product) return Promise.reject();
            return Reservation.find({
                start: { $gte: new Date() },
                $and:  [
                    { $or: product.rooms.map(room_id => ({ rooms: room_id })) },
                    { $or: [
                        { confirmed: true },
                        { confirmed: false, created: { $gte: moment().subtract(15, 'minutes').toDate() } },
                    ]},
                ],
            });
        }).
        then(reservations => {
            res.json(reservations.map(x => [
                utils.momentToCalendarDate(moment(x.start)),
                utils.momentToCalendarDate(moment(x.end)),
            ]));
        }).
        catch(err => {
            res.status(500).end();
            throw err;
        });
});


router.post('/:venue_id/:product_id', (req, res) => {
    const venue_id   = req.params.venue_id;
    const product_id = req.params.product_id;
    const start    = utils.clientDateToMoment(req.body.start);
    const end      = utils.clientDateToMoment(req.body.end);
    const details  = {
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
        || !venue_id
        || !product_id) {
        res.status(400).end();
        return;
    }

    let venue = null;
    Venue.findById(venue_id).
        then(_venue => {
            if (!_venue) return Promise.reject();
            venue = _venue;
        }).
        // Check that we can book the product
        then(() => venue.check_product(product_id, start, end)).
        then(can_book => {
            if (!can_book) return res.status(400).end();
            // calculate prices
            const duration = end.diff(start, 'minutes') / 60;
            const {price, type} = booking_info.get_price(
                venue.get_product(product_id),
                duration
            );
            return new Promise((resolve, reject) => {
                // can book so we create payment and then make reservation
                paypal.create_payment(`${venue.name} (${duration} hours)`, price, (err, payment, info) => {
                    if (err) return res.status(400).end();
                    venue.book_product(product_id, {
                        start:     start,
                        end:       end,
                        customer:  details,
                        confirmed: false,
                        rate:      type,
                        payment: {
                            token: info.token,
                            id:    payment.id,
                        }
                    }).
                        then(_ => resolve(res.redirect(info.redirect))).
                        catch(reject);
                });
            });
        }).
        catch(err => {
            res.status(500).end();
            throw err;
        });
});


module.exports = router;
