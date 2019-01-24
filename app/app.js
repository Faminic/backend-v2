const express = require('express');
const morgan = require('morgan');

const local_app = function () {}

// * ———————————————————————————————————————————————————————— * //
// * 	init
// *
// *	gets called upon starting enduro.js production server
// *	@param {express app} app - express app
// *	@return {nothing}
// * ———————————————————————————————————————————————————————— * //
local_app.prototype.init = function (app) {
    // middleware
    app.use(morgan('dev'));
    app.use(express.json());
    app.use(express.urlencoded({extended: false}));

    // routes
    app.use('/api/contact-us', require('./routes/contact-us'));
    app.use('/api/paypal',     require('./routes/paypal'));
    app.use('/api/booking',    require('./routes/booking'));
}

module.exports = new local_app()
