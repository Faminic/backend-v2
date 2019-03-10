const session = require('supertest-session');
const express = require('express');
const assert = require('assert');
const { Venue, Reservation, nukeDB } = require('./db');
const { today, momentToCalendarDate } = require('../app/utils');
const { get_app, venue_config, non_bookable_config } = require('./helpers');

let venue = null;
let non_bookable = null;

async function createDB() {
    await nukeDB();
    venue = new Venue(venue_config);
    non_bookable = new Venue(non_bookable_config);
    await venue.save();
    await non_bookable.save();
}

// because we need to test authentication tokens
let testSession = null;
const ogDescribe = describe;
describe = (name, fn) => {
    ogDescribe(name, function() {
        before(() => {
            testSession = session(get_app());
        });
        fn();
    });
};


function test_needs_auth(method, url) {
    it('should require login', async function() {
        if ( typeof url !== 'string' ) {
            url = url();
        }
        await testSession[method]('/booking-admin/venues').expect(401);
        // These MUST fail
        await testSession.post('/booking-admin/auth').send({}).expect(401);
        await testSession.post('/booking-admin/auth').send({ username: 'admin' }).expect(401);
        await testSession
            .post('/booking-admin/auth')
            .send({ username: 'admin', password: 'abc' })
            .expect(200);
    });
}


describe('GET /booking-admin/venues', function() {
    before(createDB);
    test_needs_auth('get', '/booking-admin/venues');
    it('should return all venues', function() {
        return testSession
            .get('/booking-admin/venues')
            .expect(200)
            .then(({ body }) => {
                assert( body instanceof Array );
                assert( body.length === 2 );
                assert( body[0]._id === venue._id.toString() );
                assert( body[1]._id === non_bookable._id.toString() );
            });
    });
});


describe('POST /booking-admin/venues', function() {
    before(createDB);
    test_needs_auth('post', '/booking-admin/venues');
    it('should create an unbookable venue', function() {
        return testSession
            .post('/booking-admin/venues')
            .send({ name: 'abc' })
            .expect(200)
            .then(async r => {
                const v = await Venue.findById(r.body._id);
                assert( !v.bookable );
                assert.equal(v.rooms.length, 0);
                assert.equal(v.products.length, 0);
            });
    });
});


describe('GET /booking-admin/venue/:id', function() {
    before(createDB);
    test_needs_auth('get', () => `/booking-admin/venue/${venue._id.toString()}`);
    it('should return the venue', function() {
        return testSession
            .get(`/booking-admin/venue/${venue._id.toString()}`)
            .expect(200)
            .then(({ body }) => {
                assert.equal(body._id, venue._id.toString());
                assert.equal(body.name, venue.name);
            });
    });
});


describe('POST /booking-admin/venue/:id', function() {
    before(createDB);
    test_needs_auth('post', () => `/booking-admin/venue/${venue._id.toString()}`);
    it('should modify the venue', function() {
        return testSession
            .post(`/booking-admin/venue/${venue._id.toString()}`)
            .send({
                name: 'ABC Hall',
                bookable: false,
            })
            .expect(200)
            .then(({ body }) => {
                assert.equal(body._id, venue._id.toString());
                assert.equal(body.name, 'ABC Hall');
                assert(!body.bookable);
            });
    });
});


describe('DELETE /booking-admin/venue/:id', function() {
    before(createDB);
    test_needs_auth('delete', () => `/booking-admin/venue/${venue._id.toString()}`);
    it('should delete the venue', function() {
        return testSession
            .delete(`/booking-admin/venue/${venue._id.toString()}`)
            .expect(200)
            .then(async () => {
                const v = await Venue.findById(venue._id);
                assert(!v);
            });
    });
});
