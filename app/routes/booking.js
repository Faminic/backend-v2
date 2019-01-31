const moment = require('moment');
const router = require('express').Router();
const utils = require('../utils');
const paypal = require('../paypalAPI');
const booking_info = require('../booking_info');
const {Venue, Reservation} = require('../models');


router.get('/', (req, res) => {
    Venue.find({}).select('-rooms -opening_hours -products.rooms').exec((err, docs) => {
        if (err) {
            console.error(err);
            res.status(500).end();
            return;
        }
        res.json(docs);
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
    Venue.findById(venue_id, (err, venue) => {
        if (err)    return res.status(500).end();
        if (!venue) return res.status(404).end();
        const product = venue.get_product(product_id);
        if (!product) return res.status(404).end();
        Reservation.find({
            start: { $gte: new Date() },
            $and:  [
                { $or: product.rooms.map(room_id => ({ rooms: room_id })) },
                { $or: [
                    { confirmed: true },
                    { confirmed: false, created: { $gte: moment().subtract(15, 'minutes').toDate() } },
                ]},
            ],
        }, (err, reservations) => {
            if (err) return res.status(500).end();
            res.json(reservations.map(x => [
                utils.momentToCalendarDate(moment(x.start)),
                utils.momentToCalendarDate(moment(x.end)),
            ]));
        });
    });
});


router.post('/:venue_id/:product_id', (req, res) => {
    const venue_id   = req.params.venue_id;
    const product_id = req.params.product_id;
    const start    = utils.clientDateToMoment(req.body.start);
    const end      = utils.clientDateToMoment(req.body.end);
    const customer = {
        name:  req.body.name,
        phone_number: req.body.phone_number,
    };

    // sanity checks
    const now = moment();
    if (!start.isAfter(now)
        || !end.isAfter(start)
        || end.diff(start, 'days') > 0
        || start.diff(now, 'days') > 31
        || !customer.name
        || !customer.phone_number) {
        res.status(400).end();
        return;
    }

    Venue.findById(venue_id, (err, venue) => {
        if (!venue) return res.status(404).end();
        // Check that we can book the product
        venue.check_product(product_id, start, end).then(can_book => {
            if (!can_book) return res.status(400).end();
            // calculate prices
            const duration = end.diff(start, 'minutes') / 60;
            const { price, rate } = booking_info.get_price(
                venue.get_product(product_id),
                duration
            );
            return new Promise((resolve, reject) => {
                // can book so we create payment and then make reservation
                paypal.create_payment(`${venue.name} (${duration} hours)`, price, (err, payment, info) => {
                    if (err) return reject(err);
                    venue.book_product(product_id, {
                        start, end, customer, rate,
                        confirmed: false,
                        payment: {
                            token: info.token,
                            id:    payment.id,
                        }
                    }).
                        then(_ => resolve(res.redirect(info.redirect))).
                        catch(reject);
                });
            });
        }).catch(err => {
            console.error(err);
            res.status(500).end();
        });
    });
});


module.exports = router;
