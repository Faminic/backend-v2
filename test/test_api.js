const request = require('supertest');
const express = require('express');
const assert = require('assert');
const moment = require('moment');
const { Venue, Reservation, nukeDB } = require('./db');
const { today, momentToCalendarDate } = require('../app/utils');

const app = express();
require('../app/app.js').init(app);


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
        saturday:  {open: "18:00", close: "21:30"},
        sunday:    {open: "18:00", close: "21:30"},
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


let venue_id = null;
const yesterday = moment(today()).add(-1, 'days');
const tomorrow  = moment(today()).add(+1, 'days');
const tomorrow2 = moment(today()).add(+2, 'days');
const slots = [
    ['product-1', yesterday.clone().hours(18).minutes(30), yesterday.clone().hours(19).minutes(00)],
    ['product-1', tomorrow.clone().hours(18).minutes(30),  tomorrow.clone().hours(19).minutes(00)],
    ['product-2', tomorrow.clone().hours(19).minutes(30),  tomorrow.clone().hours(20).minutes(00)],
    ['product-1', tomorrow2.clone().hours(18).minutes(30), tomorrow2.clone().hours(19).minutes(00)],
];


async function createDB() {
    await nukeDB();
    await venue.save();
    venue_id = venue._id.toString();
    // create some reservations
    const customer = {
        name: 'John Doe',
        phone_number: '123',
    };
    for (var i = 0; i < slots.length; i++) {
        const [product_id, start, end] = slots[i];
        await venue.book_product(product_id, {
            start, end,
            confirmed: true,
            customer,
            payment: {
                id:    `id-${i + 1}`,
                token: `token-${i + 1}`,
            },
        });
    }
}


describe('GET /api/booking/taken/:venue_id/:product_id', function() {
    before(createDB);

    it('returns the correct list of taken bookings', function() {
        return request(app)
            .get(`/api/booking/taken/${venue_id}/product-1`)
            .set('Accept', 'application/json')
            .expect(200)
            .then(r => {
                assert.deepEqual(r.body, [
                    [ momentToCalendarDate(slots[1][1]), momentToCalendarDate(slots[1][2]) ],
                    [ momentToCalendarDate(slots[2][1]), momentToCalendarDate(slots[2][2]) ],
                    [ momentToCalendarDate(slots[3][1]), momentToCalendarDate(slots[3][2]) ],
                ]);
            });
    });
});
