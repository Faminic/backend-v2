const mongoose = require('mongoose');
const moment = require('moment');
const {within_opening_hours} = require('./booking_info');
mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true});


const timeString = { type: String, match: /[0-9][0-9]:[0-9][0-9]/ };


const venueSchema = new mongoose.Schema({
    name: String,
    opening_hours: {
        // times should look like HH:MM
        monday:    {open: timeString, close: timeString},
        tuesday:   {open: timeString, close: timeString},
        wednesday: {open: timeString, close: timeString},
        thursday:  {open: timeString, close: timeString},
        friday:    {open: timeString, close: timeString},
        saturday:  {open: timeString, close: timeString},
        sunday:    {open: timeString, close: timeString},
    },
    // Every venue has a set of rooms.
    rooms: [{
        id:   String,
        name: String,
    }],
    // Each venue has a set of products, i.e. rooms that it makes
    // available for reservation.
    products: [{
        id:             String,
        name:           String,
        price_per_hour: Number,
        price_half_day: Number,
        price_full_day: Number,
        rooms:          [String],
    }],
});


const reservationSchema = new mongoose.Schema({
    venue_id:   mongoose.Schema.Types.ObjectId,
    // Reservation can span multiple rooms
    rooms:      [String], // Should point to id attribute in Venue's rooms
    rate:       { type: String, match: /hour|half_day|full_day/ },
    start:      Date,
    end:        Date,
    created:    Date,
    confirmed:  Boolean,
    customer: {
        name:         String,
        phone_number: String,
    },
    payment: {
        id:    String,
        token: String,
    },
});


venueSchema.methods.get_room = function(room_id) {
    // Finds the product with the given product_id
    //   product_id: String
    return this.rooms.find(p => p.id === room_id);
};


venueSchema.methods.get_product = function(product_id) {
    // Finds the product with the given product_id
    //   product_id: String
    return this.products.find(p => p.id === product_id);
};


venueSchema.methods.check_product = function(product_id, start, end) {
    // Check if the product_id is available for booking between start and end.
    //   product_id: String
    //   start: moment
    //   end: moment
    const prod = this.get_product(product_id);
    if (!prod || !within_opening_hours(this, start) || !within_opening_hours(this, end))
        return Promise.resolve(false);
    return Reservation.findOne({
            venue_id: this.id,
            start: { $gte: start.toDate() },
            end:   { $lte: end.toDate() },
            $and:  [
                { $or: prod.rooms.map(room_id => ({ rooms: room_id })) },
                { $or: [
                    { confirmed: true },
                    { confirmed: false, created: { $gte: moment().subtract(15, 'minutes').toDate() } },
                ]},
            ],
        }).
        then(x => (x ? false : true));
};


venueSchema.methods.book_product = function(product_id, {customer, payment, start, end, confirmed}) {
    // Books the product_id with configuration config.
    //   product_id: String
    //   config: {
    //       start: moment
    //       end: moment
    //       customer: {
    //          name: String
    //          phone_number: String
    //       }
    //       payment: {
    //          id: String
    //          token: String
    //       }
    //  }
    const prod = this.get_product(product_id);
    if (!prod)
        return Promise.reject();
    const now = new Date();
    return Reservation.create({
        venue_id: this.id,
        rooms: prod.rooms,
        customer,
        payment,
        start: start.toDate(),
        end:   end.toDate(),
        created: now,
        confirmed: confirmed || false,
    });
};


reservationSchema.statics.find_payment = function(payment) {
    // Finds reservations with given payment details. At least one of
    // payment.token or payment.id should be specified.
    //      payment: {
    //          'payment.token': String (optional)
    //          'payment.id':    String (optional)
    //      }
    return Reservation.findOne({
        ...payment,
        confirmed: false,
        created:   { $gte: moment().subtract(15, 'minutes').toDate() },
    });
};


reservationSchema.statics.cancel_payment = function(token) {
    // Cancels a payment with the given token.
    //      token: String
    return Reservation.deleteOne({
        confirmed: false,
        'payment.token': token,
    });
};


const Venue       = mongoose.model('Venue', venueSchema);
const Reservation = mongoose.model('Reservation', reservationSchema);


module.exports = {
    Venue,
    Reservation,
};