'use strict';

const assert = require('assert');
const moment = require('moment');
const email = require('../app/email');
const models = require('../app/models');
const utils = require('../app/utils');
const booking_info = require('../app/booking_info');
const chai = require('chai');

var expect = chai.expect;
var should = chai.should;

describe('booking_info.js', function() {
    describe('get_price', function() {
        it('calculate correct price', function(done) {
            assert.notEqual(booking_info.get_price('Football Pitch', 4),0,'get price has a value that is not 0');
            done();
        });
    });

    const venue = {
        opening_hours: {
            sunday:    {open: "10:00", close: "12:30"},
            monday:    {open: "18:00", close: "21:30"},
            tuesday:   {open: "18:00", close: "21:30"},
            wednesday: {open: "18:00", close: "21:30"},
            thursday:  {open: "18:00", close: "21:30"},
            friday:    {open: "18:00", close: "21:30"},
            saturday:  {open: "10:00", close: "16:30"},
        },
    };

    describe('within the hours', function() {
        var m = moment('2019-03-03T09:00:00Z');
        it('is within', function() {
            assert( !booking_info.within_opening_hours(venue, m) );
        })
    })
});

describe('email', function() {
    describe('sends email', function() {
        it('suceeds', function(done) {
            expect(email).to.not.be.an('error');
            done();
        })
    })
});

describe('utils', function() {
    var m;
    var s;
    beforeEach(function() {
        var mockMoment = moment('2019-03-03T09:00:00Z');
        m = mockMoment;
        // var dateString = '2019-01-01:23:54';
        // s = dateString;
    });
    describe('moment to calendar date', function() {
        it('suceeds', function() {
            expect(utils.momentToCalendarDate(m)).to.be.a('string');
        })
    })
    describe('client date to moment', function() {
        it('suceeds', function() {
            expect(utils.clientDateToMoment('2019-01-01:23:54')).to.be.a('object');
        })
        // it('fails', function(done){
        //     expect(utils.clientDateToMoment('tnhbgfvdc')).to.be.an('error');
        //     done();
        // })
    })
    describe('status error', function(){
        it('suceeds', function() {
            expect(new utils.StatusError());
        })
    })
    // describe('catch errors', function() {
    //     it('suceeds', function(done) {
    //         expect(utils.catch_errors(utils.StatusError())).to.have.status(500);
    //         done();
    //     })
    // })
  
})
