const email = require('../email');
const router = require('express').Router();


router.post('/', (req, res) => {
    email({
        from: 'durhamredthunder2018@gmail.com',
        to:   'durhamredthunder2018@gmail.com',
        subject: 'Enquiry from Contact Form',
        text:    `
Name:  ${req.body.name}
Email: ${req.body.email}
Telephone: ${req.body.telephone || "not given"}

${req.body.query}`
    });
    res.json({});
});


module.exports = router;
