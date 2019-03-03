const assert = require('assert');
const moment = require('moment');
const { get_price, within_opening_hours } = require('../app/booking_info');


describe('get_price', function() {
    const product = {
        price_per_hour: 20,
        price_half_day: 50,
        price_full_day: 90,
    };
    it('should find best rates', function() {
        assert.deepEqual(get_price(product, 1), { price: '20.00', rate: 'hour' });
        assert.deepEqual(get_price(product, 2), { price: '40.00', rate: 'hour' });
        assert.deepEqual(get_price(product, 3), { price: '50.00', rate: 'half_day' });
        assert.deepEqual(get_price(product, 6), { price: '90.00', rate: 'full_day' });
        assert.deepEqual(get_price(product, 8), { price: '160.00', rate: 'hour' });
    });

    it('should work without price_half_day', function() {
        delete product.price_half_day;
        assert.deepEqual(get_price(product, 3), { price: '60.00', rate: 'hour' });
    });

    it('should work without price_full_day', function() {
        delete product.price_full_day;
        assert.deepEqual(get_price(product, 7), { price: '140.00', rate: 'hour' });
    });

    const product2 = { price_per_hour: 20.30 };
    it('handles fractional prices', function() {
        assert.deepEqual(get_price(product2, 3), { price: '60.90', rate: 'hour' });
    });
});


describe('within_opening_hours', function() {
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

    const days = [];
    for (var i = 0; i < 7; i++) {
        // 3/3/19 = sunday
        days.push( moment([2019, 2, 3 + i]) );
    }

    it('should return true for valid times', function() {
        assert( within_opening_hours(venue, days[0].hours(11)) );
        assert( within_opening_hours(venue, days[0].hours(12).minutes(30)) );
        assert( within_opening_hours(venue, days[1].hours(18).minutes(30)) );
        assert( within_opening_hours(venue, days[6].hours(13).minutes(00)) );
    });

    it('should return false for invalid times', function() {
        assert( !within_opening_hours(venue, days[0].hours(09).minutes(00)) );
        assert( !within_opening_hours(venue, days[1].hours(17).minutes(30)) );
        assert( !within_opening_hours(venue, days[1].hours(22).minutes(00)) );
        assert( !within_opening_hours(venue, days[6].hours(09).minutes(30)) );
    });
});
