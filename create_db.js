const process = require('process');
const uuidv4 = require('uuid/v4');
const { Venue, Reservation } = require('./app/models');


const opening_hours = {
    monday:    {open: "18:00", close: "21:30"},
    tuesday:   {open: "18:00", close: "21:30"},
    wednesday: {open: "18:00", close: "21:30"},
    thursday:  {open: "18:00", close: "21:30"},
    friday:    {open: "18:00", close: "21:30"},
    saturday:  {open: "10:00", close: "16:30"},
    sunday:    {open: "10:00", close: "12:30"},
};


function single_room(name, prices) {
    const room_id = uuidv4();
    return {
        name,
        rooms: [{
            id: room_id,
            name,
        }],
        opening_hours,
        products: [{
            ...prices,
            id: uuidv4(),
            name,
            rooms: [room_id],
        }]
    };
}


const sports_hall_1 = uuidv4();
const sports_hall_2 = uuidv4();


Venue.deleteMany({})
     .then(() => Venue.insertMany([
         single_room("Theatre",                { price_per_hour: 40, price_half_day: 100, price_full_day: 170 }),
         single_room("Dining Hall",            { price_per_hour: 20, price_half_day:  50, price_full_day:  90 }),
         single_room("Performing Arts Room",   { price_per_hour: 15, price_half_day:  40, price_full_day:  70 }),
         single_room("Green Room",             { price_per_hour: 12, price_half_day:  30, price_full_day:  50 }),
         single_room("Astro Turf",             { price_per_hour: 30, price_half_day:  80, price_full_day: 120 }),
         single_room("Gym",                    { price_per_hour: 25, price_half_day:  60, price_full_day: 110 }),
         single_room("IT Suite",               { price_per_hour: 20, price_half_day:  50, price_full_day:  90 }),
         single_room("11 v 11 Football Pitch", { price_per_hour: 20 }),
         single_room("Junior Football Pitch",  { price_per_hour: 20 }),
         {
             name: "Sports Hall",
             rooms: [
                { id: sports_hall_1, name: "Hall 1" },
                { id: sports_hall_2, name: "Hall 2" },
             ],
             opening_hours,
             products: [
                 {
                     id: uuidv4(),
                     rooms: [sports_hall_1, sports_hall_2],
                     name: "Full",
                     price_per_hour: 40, price_half_day: 100, price_full_day: 170,
                 },
                 {
                     id: uuidv4(),
                     rooms: [sports_hall_1],
                     name: "Hall 1",
                     price_per_hour: 25, price_half_day: 60, price_full_day: 110,
                 },
                 {
                     id: uuidv4(),
                     rooms: [sports_hall_2],
                     name: "Hall 2",
                     price_per_hour: 25, price_half_day: 60, price_full_day: 110,
                 },
             ]
         },
     ]))
     .then(() => process.exit());
