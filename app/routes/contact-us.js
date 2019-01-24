'use strict';
const nodemailer = require('nodemailer');
const process = require('process');
const router = require('express').Router();


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: require('../keys/gmail.json'),
});


router.post('/', (req, res) => {
    let mailOptions = {
        from: 'durhamredthunder2018@gmail.com',
        to:   'durhamredthunder2018@gmail.com',
        subject: 'Enquiry from Contact Form',
        text:    `
Name:  ${req.body.name}
Email: ${req.body.email}
Telephone: ${req.body.telephone || "not given"}

${req.body.query}`
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('SendMail Error:');
            console.error(error);
        }
    });
    res.redirect('/contact-us');
});


module.exports = router;
