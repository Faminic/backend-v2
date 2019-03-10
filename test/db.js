const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/testing-db', {useNewUrlParser: true});

const { Venue, Reservation } = require('../app/models');

async function nukeDB() {
    await Venue.deleteMany({});
    await Reservation.deleteMany({});
}

module.exports = {
    Venue,
    Reservation,
    nukeDB,
}
