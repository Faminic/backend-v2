const { get_app } = require('./helpers');
const assert = require('assert');
const { authenticate } = require('../app/routes/bookings-admin-ui/auth');

get_app();

describe('authenticate()', function() {
    it('returns true if the username and password is correct', function() {
        assert(authenticate('admin', 'abc'));
    });
    it('returns false otherwise', function() {
        const invalid = [
            ['admin', 'def'],
            ['adm', 'abc'],
            ['', 'abc'],
        ];
        invalid.forEach(([username, password]) => {
            assert( !authenticate(username, password) );
        });
    });
});
