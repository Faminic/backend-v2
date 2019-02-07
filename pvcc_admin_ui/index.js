const moment = require('moment');
const express = require('express');
const morgan = require('morgan');
const router = express.Router();
const {Venue, Reservation} = require('../app/models');
const utils = require('../app/utils');


router.use(morgan('dev'));
router.use(express.json());
router.use(express.static('pvcc_admin_ui/public'));


function log_500(res) {
    return (err) => {
        console.error(err);
        res.status(500);
        res.end();
    };
}


router.get('/venues', (req, res) => {
    // Gets a list of venues
    Venue.find({}, ['name', '_id'])
        .then(docs => res.json(docs))
        .catch(log_500(res));
});


router.post('/venue/:id', (req, res) => {
    // Modifies a venue.
    // req.body should be JSON, refer to app/models.js for
    // venue schema.
    Venue.findById(req.params.id)
         .then(venue => {
             if (!venue) {
                 res.status(404);
                 res.end();
                 return;
             }
             // Should use this instead of findByIdAndUpdate because we want
             // some schema checking.
             Object.assign(venue, req.body);
             return venue.save().then(() => res.json(venue));
         })
         .catch(log_500(res));
});


router.get('/venue/:id', (req, res) => {
    // Gets detail for a venue
    Venue.findById(req.params.id)
         .then(result => res.json(result))
         .catch(log_500(res));
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
            if (!prod) {
                res.status(404);
                res.end();
                return;
            }
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
        catch(log_500(res));
});


router.post('/venue/:id/:product_id/reservations', (req, res) => {
    // Creates a reservation for a given venue and product
    // See app/models.js for schema
    Venue.findById(req.params.id).
        then(venue => venue.book_product(req.params.product_id, {
            customer:  req.body.customer,
            payment:   req.body.payment,
            start:     utils.clientDateToMoment(req.body.start),
            end:       utils.clientDateToMoment(req.body.end),
            confirmed: true,
        })).
        then(reservation => res.json(reservation)).
        catch(log_500(res));
});


router.delete('/reservation/:id', (req, res) => {
    // Delete a reservation by id
    Reservation.findByIdAndDelete(req.params.id).
        then(() => res.json({})).
        catch(log_500(res));
});


module.exports = router;
if (require.main === module) {
    const app = express();
    app.use('/', router);
    app.listen(8080, () => {});
}
