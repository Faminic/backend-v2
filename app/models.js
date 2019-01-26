const mongoose = require('mongoose');
const moment = require('moment');
mongoose.connect('mongodb://localhost:27017/test', {useNewUrlParser: true});


const venueSchema = new mongoose.Schema({
    name: String,
    opening_hours: {
        // times should look like HH:MM
        monday:    {open: String, close: String},
        tuesday:   {open: String, close: String},
        wednesday: {open: String, close: String},
        thursday:  {open: String, close: String},
        friday:    {open: String, close: String},
        saturday:  {open: String, close: String},
        sunday:    {open: String, close: String},
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
    // Reservation can span multiple rooms
    rooms:      [String],
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


venueSchema.methods.get_product = function(product_id) {
    // Finds the product with the given product_id
    //   product_id: String
    return this.products.find(p => p.id === product_id);
};


venueSchema.methods.check_product = function(product_id, start, end) {
    // Check if the product_id is available for booking between start and end.
    //   product_id: String
    //   start: Date
    //   end: Date
    const prod = this.get_product(product_id);
    if (!prod)
        return Promise.resolve(false);
    return Reservation.findOne({
            start: { $gte: start },
            end:   { $lte: end },
            $and:  [
                { $or: prod.rooms.map(room_id => ({ rooms: room_id })) },
                { $or: [
                    { confirmed: true },
                    { confirmed: false, created: { $gte: moment().subtract(15, 'minutes').toDate() } },
                ]},
            ],
        }).
        then(x => x ? false : true);
};


venueSchema.methods.book_product = function(product_id, {customer, payment, start, end}) {
    // Books the product_id with configuration config.
    //   product_id: String
    //   config: {
    //       start: Date
    //       end: Date
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
        return Promise.resolve(false);
    const now = new Date(),
    return Reservation.create({
        rooms: prod.rooms,
        customer,
        payment,
        start,
        end,
        created: now,
        confirmed: false,
    });
};


reservationSchema.statics.find_payment = function(payment) {
    // Finds reservations with given payment details. At least one of
    // payment.token or payment.id should be specified.
    //      payment: {
    //          token: String (optional)
    //          id:    String (optional)
    //      }
    return Reservation.findOne({
        payment,
        confirmed: false,
        created:   { $gte: moment().subtract(15, 'minutes').toDate() },
    }).then(x => x ? true : false);
};


reservationSchema.statics.confirm_payment = function(payment) {
    // Confirms a payment, at least one of payment.token or payment.id
    // should be specified.
    //      payment: {
    //          token: String (optional)
    //          id:    String (optional)
    //      }
    return Reservation.updateMany({
        confirmed: false,
        created:   { $gte: moment().subtract(15, 'minutes').toDate() },
        payment:   payment,
    }, {
        confirmed: true,
    });
};


reservationSchema.statics.cancel_payment = function(payment) {
    // Cancels a payment, at least one of payment.token or payment.id
    // should be specified.
    //      payment: {
    //          token: String (optional)
    //          id:    String (optional)
    //      }
    return Reservation.deleteMany({
        confirmed: false,
        payment:   payment,
    });
};


reservationSchema.statics.find_between = function(room_id, start, end) {
    // Finds a reservation for room_id between start and end
    //      room_id: String
    //      start:   Date
    //      end:     Date
    return Reservation.findOne({
        room_id,
        $or: [
            { confirmed: true },
            { confirmed: false, created: { $gte: moment().subtract(15, 'minutes').toDate() } },
        ],
        start:    { $gte: start },
        end:      { $lte: end },
    });
};


const Venue       = mongoose.model('Venue', venueSchema);
const Reservation = mongoose.model('Reservation', reservationSchema);


module.exports = {
    Venue,
    Reservation,
};
