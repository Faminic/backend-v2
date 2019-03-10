const assert = require('assert');
const moment = require('moment');
const { clientDateToMoment, catch_errors, StatusError } = require('../app/utils');


describe('clientDateToMoment', function() {
    it('throws an error given invalid date', function() {
        assert.throws(() => clientDateToMoment('2019-13-10T10:00:00'), Error, "invalid date!");
        assert.throws(() => clientDateToMoment('2019-02-29T10:00:00'), Error, "invalid date!");
    });
    it('correctly rounds to half hour', function() {
        // round down
        const m = clientDateToMoment('2019-12-01T10:45:01');
        assert.deepEqual([m.year(), m.month(), m.date(), m.hours(), m.minutes(), m.seconds()], [2019, 11, 01, 10, 30, 00]);
    });
});


describe('catch_errors', function() {
    function mockRequest() {
        this._status = null;
        this._ended = false;
    }
    mockRequest.prototype.status = function(s) { this._status = s; };
    mockRequest.prototype.end = function() { this._ended = true; };

    it('catches StatusErrors properly', function(done) {
        var req = new mockRequest();
        Promise.
            resolve(true).
            then(() => { throw new StatusError(404); }).
            catch(err => {
                catch_errors(req)(err);
                assert.equal(req._status, 404);
                assert(req._ended);
            }).
            finally(done);
    });

    it('gives 500 on other errors', function(done) {
        var req = new mockRequest();
        Promise.
            resolve(true).
            then(() => { throw new Error("foo"); }).
            catch(err => {
                // we expect some logging here as well
                catch_errors(req)(err);
                assert.equal(req._status, 500);
                assert(req._ended);
            }).
            finally(done);
    });
});
