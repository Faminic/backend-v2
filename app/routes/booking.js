const process = require('process');
const moment = require('moment');
const router = require('express').Router();
const utils = require('../utils');
const paypal = require('../paypalAPI');
const booking_info = require('../booking_info');
const {Venue, Reservation} = require('../models');


const IS_DEBUG = process.env.NODE_ENV === 'test';


router.get('/', (req, res) => {
    Venue.find({ bookable: true }).select('-rooms -bookable -products.rooms').exec((err, docs) => {
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
    Venue.findById(venue_id).
        then(venue => {
            if (!venue) throw new utils.StatusError(404);
            const product = venue.get_product(product_id);
            if (!product) throw new utils.StatusError(404);
            return Reservation.find({
                start: { $gte: new Date() },
                $and:  [
                    { $or: product.rooms.map(room_id => ({ 'rooms.id': room_id })) },
                    { $or: [
                        { confirmed: true },
                        { confirmed: false, created: { $gte: moment().subtract(15, 'minutes').toDate() } },
                    ]},
                ],
            });
        }).
        then(reservations => res.json(reservations.map(x => [
                utils.momentToCalendarDate(moment(x.start)),
                utils.momentToCalendarDate(moment(x.end)),
        ]))).
        catch(utils.catch_errors(res));
});


router.post('/:venue_id/:product_id', (req, res) => {
    const venue_id   = req.params.venue_id;
    const product_id = req.params.product_id;
    const purpose  = req.body.purpose;
    const start    = utils.clientDateToMoment(req.body.start);
    const end      = utils.clientDateToMoment(req.body.end);
    const customer = {
        name:         req.body.name,
        phone_number: req.body.phone_number,
        email:        req.body.email,
    };
    // sanity checks
    const now = moment();
    if (!start.isAfter(now)
        || !end.isAfter(start)
        || end.diff(start, 'days') > 0
        || start.diff(now, 'days') > 32
        || !customer.name
        || !customer.phone_number
        || !customer.email
        || !purpose) {
        res.status(400).end();
        return;
    }
    let redirect_link = null;
    let venue = null;
    Venue.findById(venue_id).
        then(_venue => {
            venue = _venue;
            if (!venue || !venue.bookable) throw new utils.StatusError(404);
        }).
        // Check that we can book the product
        then(() => venue.check_product(product_id, start, end)).
        then(can_book => {
            if (!can_book) throw new utils.StatusError(400);
            // can book => calculate prices
            const duration  = end.diff(start, 'minutes') / 60;
            const product   = venue.get_product(product_id);
            const { price } = booking_info.get_price(product, duration);
            // debug => fast track to 200
            if (IS_DEBUG) {
                venue.book_product(product_id, {
                    start, end, customer, purpose,
                    confirmed: false,
                    payment: {
                        token: 'abc',
                        id:    'def',
                    }
                });
                res.json({ price });
                throw new utils.StatusError(200);
            }
            return paypal.create_payment(`${venue.name} (${duration} hours)`, price);
        }).
        // Make reservation
        then(({payment, info}) => {
            redirect_link = info.redirect;
            return venue.book_product(product_id, {
                start, end, customer,
                confirmed: false,
                payment: {
                    token: info.token,
                    id:    payment.id,
                }
            });
        }).
        then(() => res.json({redirect: redirect_link})).
        catch(utils.catch_errors(res));
});


module.exports = router;
