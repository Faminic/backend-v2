const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: require('./keys/gmail.json'),
});

module.exports = function(mail) {
    transporter.sendMail(mail).
        catch(err => {
            console.error("Sendmail Error:");
            console.error(err);
        });
};
