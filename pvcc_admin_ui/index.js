const moment = require('moment');
const express = require('express');
const morgan = require('morgan');
const router = express.Router();
const {Venue, Reservation} = require('../app/models');
const utils = require('../app/utils');


router.use(morgan('dev'));
router.use(express.json());
router.use(express.static('pvcc_admin_ui/public'));


router.get('/venues', (req, res) => {
    // Gets a list of venues
    Venue.find({}, ['name', '_id'])
        .then(docs => res.json(docs))
        .catch(err => {
            throw err;
        });
});


router.post('/venue/:id', (req, res) => {
    // Modifies a venue.
    // req.body should be JSON, refer to app/models.js for
    // venue schema.
    Venue.findByIdAndUpdate(req.params.id, req.body)
         .then(result => res.json(result))
         .catch(err => {
             throw err;
         });
});


router.get('/venue/:id', (req, res) => {
    // Gets detail for a venue
    Venue.findById(req.params.id)
         .then(result => res.json(result))
         .catch(err => {
             throw err;
         });
});


router.get('/venue/:id/:product_id/reservations', (req, res) => {
    // Gets a list of reservations which have not expired for
    // a given venue and product
    const page = (req.query.page || 1) - 1;
    Venue.findById(req.params.id).
        then(venue => {
            const prod = venue.get_product(req.params.product_id);
            return Reservation.find({
                    $and: [
                        { $or: prod.rooms.map(room_id => ({ rooms: room_id })) },
                        { $or: [
                            { confirmed: true },
                            { confirmed: false, created: { $gte: moment().subtract(15, 'minutes').toDate() } },
                        ]},
                    ],
                },
                null,
                { skip: 25 * page, sort: { created: -1 } });
        }).
        then(docs => res.json(docs)).
        catch(err => {
            throw err;
        });
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
        catch(err => {
            throw err;
        });
});


router.delete('/reservation/:id', (req, res) => {
    // Delete a reservation by id
    Reservations.findByIdAndDelete(req.params.id).
        then(() => res.json({})).
        catch(err => {
            throw err;
        });
});


module.exports = router;
if (require.main === module) {
    const app = express();
    app.use('/', router);
    app.listen(8080, () => {});
}
