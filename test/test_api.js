const request = require('supertest');
const express = require('express');
const assert = require('assert');
const moment = require('moment');
const { Venue, Reservation, nukeDB } = require('./db');
const { today, momentToCalendarDate } = require('../app/utils');
const { get_app, venue_config, non_bookable_config } = require('./helpers');


const app = get_app();


let venue = null;
let non_bookable = null;
const yesterday = moment(today()).add(-1, 'days');
const tomorrow  = moment(today()).add(+1, 'days');
const tomorrow2 = moment(today()).add(+2, 'days');
const slots = [
    ['product-1', yesterday.clone().hours(18).minutes(30), yesterday.clone().hours(19).minutes(00)],
    ['product-1', tomorrow.clone().hours(18).minutes(30),  tomorrow.clone().hours(19).minutes(00)],
    ['product-2', tomorrow.clone().hours(19).minutes(30),  tomorrow.clone().hours(20).minutes(00)],
    ['product-1', tomorrow2.clone().hours(18).minutes(30), tomorrow2.clone().hours(19).minutes(00)],
    ['product-3', tomorrow2.clone().hours(18).minutes(30), tomorrow2.clone().hours(19).minutes(00), false],
    ['product-3', tomorrow2.clone().hours(18).minutes(00), tomorrow2.clone().hours(20).minutes(00), false],
];


async function createDB() {
    await nukeDB();
    venue = new Venue(venue_config);
    non_bookable = new Venue(non_bookable_config);
    await venue.save();
    await non_bookable.save();
    // create some reservations
    const customer = {
        name: 'John Doe',
        phone_number: '123',
    };
    for (var i = 0; i < slots.length; i++) {
        const [product_id, start, end, confirmed] = slots[i];
        await venue.book_product(product_id, {
            start, end,
            confirmed: confirmed === false ? false : true,
            customer,
            payment: {
                id:    `id-${i + 1}`,
                token: `token-${i + 1}`,
            },
        });
    }
}


describe('GET /api/booking', function() {
    before(createDB);

    it('returns a list of bookable venues', function() {
        return request(app)
            .get(`/api/booking/`)
            .expect(200)
            .then(r => {
                assert.equal(r.body.length, 1);
                assert.equal(r.body[0]._id, venue._id.toString());
            });
    });
});


describe('GET /api/booking/taken/:venue_id/:product_id', function() {
    before(createDB);

    it('returns the correct list of taken bookings', function() {
        return request(app)
            .get(`/api/booking/taken/${venue._id.toString()}/product-2`)
            .expect(200)
            .then(r => {
                assert.deepEqual(r.body, [
                    [ momentToCalendarDate(slots[1][1]), momentToCalendarDate(slots[1][2]) ],
                    [ momentToCalendarDate(slots[2][1]), momentToCalendarDate(slots[2][2]) ],
                    [ momentToCalendarDate(slots[3][1]), momentToCalendarDate(slots[3][2]) ],
                    [ momentToCalendarDate(slots[4][1]), momentToCalendarDate(slots[4][2]) ],
                    [ momentToCalendarDate(slots[5][1]), momentToCalendarDate(slots[5][2]) ],
                ]);
            });
    });

    it('returns the correct list of taken bookings', function() {
        return request(app)
            .get(`/api/booking/taken/${venue._id.toString()}/product-3`)
            .expect(200)
            .then(r => {
                assert.deepEqual(r.body, [
                    [ momentToCalendarDate(slots[2][1]), momentToCalendarDate(slots[2][2]) ],
                    [ momentToCalendarDate(slots[4][1]), momentToCalendarDate(slots[4][2]) ],
                    [ momentToCalendarDate(slots[5][1]), momentToCalendarDate(slots[5][2]) ],
                ]);
            });
    });
});


describe('GET /api/paypal/ok', function() {
    before(createDB);

    it('gives 403 if there is no token', function() {
        return request(app)
            .get(`/api/paypal/ok`)
            .expect(403);
    });

    it('ensures that the reservation is unique', function() {
        return request(app)
            .get(`/api/paypal/ok?paymentId=id-5&PayerID=abc&token=token-5`)
            .expect(302);
    });

    it('ensures that the reservation is not confirmed prior', function() {
        return createDB().then(() => Reservation
            .find_payment({'payment.id': 'id-5'})
            .remove()
            .then(() =>
                request(app)
                    .get('/api/paypal/ok?paymentId=id-6&PayerID=abc&token=token-6')
                    .expect(302)
                    .then(async () => {
                        const r = await Reservation.findOne({'payment.id': 'id-6'});
                        assert(r.confirmed);
                    })
            ));
    });
});


describe('GET /api/paypal/cancel', function() {
    before(createDB);

    it('gives 403 if there is no token', function() {
        return request(app)
            .get(`/api/paypal/cancel`)
            .expect(403);
    });

    it('deletes an unconfirmed reservation', function() {
        return request(app)
            .get(`/api/paypal/cancel?token=token-5`)
            .expect(302)
            .then(r => Reservation.findOne({ 'payment.token': 'token-5' }))
            .then(x => assert(!x));
    });

    it('does not delete a confirmed reservation', function() {
        return request(app)
            .get(`/api/paypal/cancel?token=token-3`)
            .expect(302)
            .then(r => Reservation.findOne({ 'payment.token': 'token-3' }))
            .then(x => assert(x));
    });
});


describe('Booking workflow', function() {
    const start = tomorrow2.clone().hours(20);
    const end   = tomorrow2.clone().hours(21).minutes(30);

    // Regression: booking 31 days from now
    describe('31 days in advance', function() {
        const s = moment(today()).add(+31, 'days').hours(20);
        const e = moment(today()).add(+31, 'days').hours(21).minutes(30);
        it('POST /api/booking/:venue/:product 200', function() {
            return request(app)
                .post(`/api/booking/${venue._id.toString()}/product-1`)
                .send({
                    name: 'Anikan',
                    phone_number: '123',
                    email: 'anikan@tatooine.org',
                    purpose: 'p',
                    start: momentToCalendarDate(s),
                    end:   momentToCalendarDate(e),
                })
                .expect(200)
                .then(async () => {
                    await Reservation.deleteMany({});
                });
        });
    });

    describe('Successful booking', function() {
        let body = null;
        let r_id = null;
        it('POST /api/booking/:venue/:product 200', function() {
            return request(app)
                .post(`/api/booking/${venue._id.toString()}/product-1`)
                .send({
                    name: 'Anikan',
                    phone_number: '123',
                    email: 'anikan@tatooine.org',
                    purpose: 'p',
                    start: momentToCalendarDate(start),
                    end:   momentToCalendarDate(end),
                })
                .expect(200)
                .then(r => { body = r.body; });
        });
        it('Price should be correct', function() {
            assert.equal(body.price, "15.00");
        });
        it('Unconfirmed reservation should be created', async function() {
            const r = await Reservation.findOne({
                confirmed: false,
                'payment.id': 'def',
                'payment.token': 'abc',
            });
            r_id = r._id;
            assert(!r.confirmed);
            assert.equal(r.customer.name, 'Anikan');
            assert.equal(r.customer.phone_number, '123');
            assert.equal(r.customer.email, 'anikan@tatooine.org');
            assert.equal(r.purpose, 'p');
            assert(moment(r.start).isSame(start));
            assert(moment(r.end).isSame(end));
            // check that rooms are equal
            assert.deepEqual(r.rooms.length, 1);
            assert.equal(r.rooms[0].id, 'room-1');
        });
        it('GET /api/paypal/ok 302', function() {
            return request(app)
                .get(`/api/paypal/ok?paymentId=def&token=abc&PayerID=foo`)
                .expect(302)
                .then(r => assert(r.header.location === '/payment-confirmed'));
        });
        it('Reservation should be confirmed', async function() {
            const r = await Reservation.findById(r_id);
            assert(r.confirmed);
        });
    });

    describe('Cancelled booking', function() {
        const tomorrow3 = moment(today()).add(+3, 'days');
        const start = tomorrow3.clone().hours(20);
        const end   = tomorrow3.clone().hours(21).minutes(30);

        it('POST /api/booking/:venue/:product 200', function() {
            return request(app)
                .post(`/api/booking/${venue._id.toString()}/product-1`)
                .send({
                    name: 'Anikan',
                    phone_number: '123',
                    email: 'anikan@tatooine.org',
                    purpose: 'p',
                    start: momentToCalendarDate(start),
                    end:   momentToCalendarDate(end),
                })
                .expect(200);
        });
        it('GET /api/paypal/cancel 302', function() {
            return request(app)
                .get(`/api/paypal/cancel?token=abc`)
                .expect(302)
                .then(r => assert.equal(r.header.location, '/payment-cancelled'));
        });
        it('Reservation should be deleted', async function() {
            const r = await Reservation.findOne({
                confirmed: false,
                'payment.id': 'def',
                'payment.token': 'abc',
            });
            assert( !r );
        });
    });

    describe('Unsuccessful booking', function() {
        it('POST /api/booking/:venue/:product with conflicting times', function() {
            return request(app)
                .post(`/api/booking/${venue._id.toString()}/product-1`)
                .send({
                    name: 'Anikan',
                    phone_number: '123',
                    email: 'anikan@tatooine.org',
                    purpose: 'p',
                    start: momentToCalendarDate(start),
                    end:   momentToCalendarDate(end),
                })
                .expect(400);
        });

        it('POST /api/booking/:venue/:product with invalid data', async function() {
            const invalid = [
                [ 500, {name: 'Anikan'} ],
                [ 500, {name: 'Anikan', purpose: 'badminton', email: 'abc@abc.org', phone_number: '12312'} ],
                [ 400, {name: 'Anikan', purpose: 'badminton', email: 'abc@abc.org', phone_number: '12312', start: momentToCalendarDate(start), end: momentToCalendarDate(start) } ],
                [ 400, {name: 'Anikan', purpose: 'badminton', email: 'abc@abc.org', phone_number: '12312', start: momentToCalendarDate(end), end: momentToCalendarDate(start) } ],
            ];
            for (var i = 0; i < invalid.length; i++) {
                await request(app)
                    .post(`/api/booking/${venue._id.toString()}/product-1`)
                    .send(invalid[i][1])
                    .expect(invalid[i][0]);
            }
        });
    });
});
