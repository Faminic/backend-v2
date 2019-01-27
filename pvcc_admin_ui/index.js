const moment = require('moment');
const express = require('express');
const morgan = require('morgan');
const router = express.Router();
const {Venue, Reservation} = require('../app/models');
const utils = require('../app/utils');


router.use(morgan('dev'));
router.use(express.json());


router.get('/venues', (req, res) => {
    Venue.find({}, ['name', '_id'])
        .then(docs => res.json(docs))
        .catch(err => {
            throw err;
        });
});


router.post('/venues/:id', (req, res) => {
    Venue.findByIdAndUpdate(req.params.id, req.body)
         .then(result => res.json(result))
         .catch(err => {
             throw err;
         });
});


router.get('/venues/:id', (req, res) => {
    Venue.findById(req.params.id)
         .then(result => res.json(result))
         .catch(err => {
             throw err;
         });
});


router.get('/venues/:id/products/:product_id/reservations', (req, res) => {
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


router.post('/venues/:id/products/:product_id/reservations', (req, res) => {
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


router.delete('/reservations/:id', (req, res) => {
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
