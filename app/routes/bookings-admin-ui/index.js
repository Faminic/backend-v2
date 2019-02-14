const moment = require('moment');
const express = require('express');
const morgan = require('morgan');
const router = express.Router();
const {Venue, Reservation} = require('../../models');
const {clientDateToMoment, StatusError, catch_errors} = require('../../utils');


const default_opening_hours = {
    monday:    {open: "18:00", close: "21:30"},
    tuesday:   {open: "18:00", close: "21:30"},
    wednesday: {open: "18:00", close: "21:30"},
    thursday:  {open: "18:00", close: "21:30"},
    friday:    {open: "18:00", close: "21:30"},
    saturday:  {open: "10:00", close: "16:30"},
    sunday:    {open: "10:00", close: "12:30"},
};


router.use(morgan('dev'));
router.use(express.json());
router.use(express.static(__dirname + '/public'));


router.post('/venues', (req, res) => {
    // Creates a venue, need to specify req.body.name
    let venue = new Venue();
    venue.name = req.body.name;
    venue.opening_hours = default_opening_hours;
    venue.save()
        .then(() => res.json(venue))
        .catch(catch_errors(res));
});


router.get('/venues', (req, res) => {
    // Gets a list of venues
    Venue.find({}, ['name', '_id'])
        .then(docs => res.json(docs))
        .catch(catch_errors(res));
});


router.post('/venue/:id', (req, res) => {
    // Modifies a venue.
    // req.body should be JSON, refer to app/models.js for
    // venue schema.
    Venue.findById(req.params.id)
         .then(venue => {
             if (!venue) throw new StatusError(404);
             // Should use this instead of findByIdAndUpdate because we want
             // some schema checking.
             Object.assign(venue, req.body);
             return venue.save().then(() => res.json(venue));
         })
         .catch(catch_errors(res));
});


router.get('/venue/:id', (req, res) => {
    // Gets detail for a venue
    Venue.findById(req.params.id)
         .then(result => res.json(result))
         .catch(catch_errors(res));
});


router.delete('/venue/:id', (req, res) => {
    // Deletes venue
    Venue.findByIdAndDelete(req.params.id)
         .then(() => res.json({}))
         .catch(catch_errors(res));
});


router.get('/venue/:id/:product_id/reservations', (req, res) => {
    // Gets a list of reservations which have not expired for
    // a given venue and product
    // add ?page=n for the n-th page (starts from 1)
    const page = (req.query.page ? parseInt(req.query.page) : 1) - 1;
    Venue.findById(req.params.id).
        then(venue => {
            const timeout = moment().subtract(15, 'minutes').toDate();
            const prod = venue.get_product(req.params.product_id);
            if (!prod) throw new StatusError(404);
            return Reservation.find({
                    $and: [
                        { $or: prod.rooms.map(room_id => ({ 'rooms.id': room_id })) },
                        { $or: [
                            { confirmed: true },
                            { confirmed: false, created: { $gte: timeout } },
                        ]},
                    ],
                },
                null,
                { skip: 25 * page, sort: { created: -1 }, limit: 25 });
        }).
        then(docs => res.json(docs)).
        catch(catch_errors(res));
});


router.post('/venue/:id/:product_id/reservations', (req, res) => {
    // Creates a reservation for a given venue and product
    // See app/models.js for schema
    const start = clientDateToMoment(req.body.start);
    const end   = clientDateToMoment(req.body.end);
    const venue = null;
    Venue.findById(req.params.id).
        then(_venue => {
            if (!_venue) throw new StatusError(404);
            venue = _venue;
        }).
        then(() => venue.check_product(req.params.product_id, start, end)).
        then(can_book => {
            if (!can_book) throw new StatusError(400);
            return venue.book_product(req.params.product_id, {
                customer:  req.body.customer,
                payment:   req.body.payment,
                start:     start,
                end:       end,
                confirmed: true,
            });
        }).
        then(reservation => res.json(reservation)).
        catch(catch_errors(res));
});


router.delete('/reservation/:id', (req, res) => {
    // Delete a reservation by id
    Reservations.findByIdAndDelete(req.params.id).
        then(() => res.json({})).
        catch(catch_errors(res));
});


module.exports = router;
