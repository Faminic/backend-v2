const process = require('process');
const express = require('express');

process.env.NODE_ENV = 'test';
let app = null;


function get_app() {
    if (!app) {
        app = express();
        require('../app/app.js').init(app);
    }
    return app;
}


const venue_config = {
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
        },
        {
            id: "product-3",
            name:           "Product 3",
            price_per_hour: 10,
            price_half_day: 20,
            price_full_day: 50,
            rooms:          ["room-2"],
        },
    ]
};


const non_bookable_config = {
    name: "Non Bookable",
    bookable: false,
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
    rooms: [],
    products: []
};


module.exports = {
    get_app,
    venue_config,
    non_bookable_config,
};
