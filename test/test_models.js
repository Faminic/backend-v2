const assert = require('assert');
const { clientDateToMoment } = require('../app/utils');
const { Reservation, Venue } = require('../app/models');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/testing-db', {useNewUrlParser: true});


const venue = new Venue({
    name: "Sports Hall",
    bookable: true,
    calendarId: "calendarId",
    opening_hours: {
        monday:    {open: "18:00", close: "21:30"},
        tuesday:   {open: "18:00", close: "21:30"},
        wednesday: {open: "18:00", close: "21:30"},
        thursday:  {open: "18:00", close: "21:30"},
        friday:    {open: "18:00", close: "21:30"},
        saturday:  {open: "10:00", close: "18:00"},
        sunday:    {open: "12:00", close: "16:00"},
    },
    rooms: [
        {
            id: "room-1",
            name: "Room 1",
        },
        {
            id: "room-2",
            name: "Room 2",
        },
    ],
    products: [
        {
            id: "product-1",
            name:           "Product 1",
            price_per_hour: 10,
            price_half_day: 20,
            price_full_day: 50,
            rooms:          ["room-1"],
        },
        {
            id: "product-2",
            name:           "Product 2",
            price_per_hour: 15,
            price_half_day: 35,
            price_full_day: 45,
            rooms:          ["room-1", "room-2"],
        }
    ]
});


before(async function() {
    // nuke DB
    await Venue.deleteMany({});
    await Reservation.deleteMany({});
});


describe('Venue', function() {
    before(async function() {
        await venue.save();
    });

    describe('#get_room()', function() {
        it('gets the room', function() {
            assert.equal(venue.get_room('room-1'), venue.rooms[0]);
            assert.equal(venue.get_room('room-2'), venue.rooms[1]);
            assert(!venue.get_room('room-3'));
        });
    });

    describe('#get_product()', function() {
        it('gets the product', function() {
            assert.equal(venue.get_product('product-1'), venue.products[0]);
            assert.equal(venue.get_product('product-2'), venue.products[1]);
            assert(!venue.get_product('product-3'));
        });
    });

    // reservation document
    let _reservation = null;

    describe('#book_product()', function() {
        const config = {
            start: clientDateToMoment("2019-03-05T19:00"),
            end:   clientDateToMoment("2019-03-05T20:00"),
            confirmed: false,
            customer: {
                name: 'John Doe',
                phone_number: '123',
            },
            payment: {
                id: 'abc',
                token: 'def',
            },
        };
        it('fails with an invalid product', function(done) {
            venue.book_product('product-3', config)
                .then(() => assert(false))
                .catch(() => {})
                .finally(done);
        });
        it('can book a valid product', function(done) {
            venue.book_product('product-2', config)
                .then(r => {
                    _reservation = r;
                    assert.equal(r.confirmed,    config.confirmed);
                    assert.deepEqual(r.customer, config.customer);
                    assert.deepEqual(r.payment,  config.payment);
                })
                .catch(() => assert(false))
                .finally(done);
        });
    });

    describe('#check_product()', function() {
        var no_conflict = [
            [clientDateToMoment("2019-03-05T18:00"), clientDateToMoment("2019-03-05T19:00")],
            [clientDateToMoment("2019-03-05T20:00"), clientDateToMoment("2019-03-05T21:00")],
            [clientDateToMoment("2019-03-05T20:00"), clientDateToMoment("2019-03-05T21:30")],
        ];
        var conflict = [
            [clientDateToMoment("2019-03-05T18:00"), clientDateToMoment("2019-03-05T19:30")],
            [clientDateToMoment("2019-03-05T19:00"), clientDateToMoment("2019-03-05T20:00")],
            [clientDateToMoment("2019-03-05T19:30"), clientDateToMoment("2019-03-05T20:00")],
            [clientDateToMoment("2019-03-05T19:30"), clientDateToMoment("2019-03-05T20:30")],
        ];
        it('returns true if there is no conflict', async function() {
            await Promise.all(
                no_conflict.map(async ([start, end]) => {
                    const c1 = await venue.check_product("product-2", start, end);
                    const c2 = await venue.check_product("product-1", start, end);
                    assert(c1);
                    assert(c2);
                })
            );
        });
        it('returns false if there is a conflict', async function() {
            await Promise.all(
                conflict.map(async ([start, end]) => {
                    const c1 = await venue.check_product("product-2", start, end);
                    const c2 = await venue.check_product("product-1", start, end);
                    assert(!c1);
                    assert(!c2);
                })
            );
        });
    });
});


describe('Reservation', function() {
    let r1 = null;
    let r2 = null;
    let r3 = null;

    before(async function() {
        const config = {
            start: clientDateToMoment("2019-03-06T19:00"),
            end:   clientDateToMoment("2019-03-06T20:00"),
            confirmed: false,
            customer: {
                name: 'John Doe',
                phone_number: '123',
            },
        };
        r1 = await venue.book_product("room-1", Object.assign({payment: { id: 'id-1', token: 'token-1' }}, config));
        r2 = await venue.book_product("room-1", Object.assign({payment: { id: 'id-2', token: 'token-2' }}, config));
        r3 = await venue.book_product("room-1", Object.assign({payment: { id: 'id-3', token: 'token-3' }}, config));
    });

    describe('#find_payment', function() {
        it('correctly finds the reseravtion object', async function() {
        });
    });
});
