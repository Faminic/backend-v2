const url = require('url');
const paypal = require('paypal-rest-sdk');
paypal.configure(require('./keys/paypal.json'));


function get_payment_details(payment) {
    const redirect = payment.links.find(link => link.rel == 'approval_url').href;
    const token = url.parse(redirect, {parseQueryString: true}).query.token;
    return {
        redirect,
        token,
    };
}


function create_payment(name, price) {
    if (typeof price !== "string") {
        // VERY important that price is a string, otherwise we may
        // have rounding issues
        throw new Error("price needs to be a string!");
    }
    return new Promise((resolve, reject) => {
        paypal.payment.create({
            intent: 'sale',
            payer: {payment_method: 'paypal'},
            redirect_urls: {
                return_url: 'http://localhost:5000/api/paypal/ok',
                cancel_url: 'http://localhost:5000/api/paypal/cancel',
            },
            transactions: [{
                description: `PVCC: ${name}`,
                item_list: {
                    items: [{
                        name: name,
                        sku:  name,
                        price: price,
                        currency: "GBP",
                        quantity: 1,
                    }]
                },
                amount: {
                    currency: "GBP",
                    total: price,
                },
            }]
        }, (err, payment) => {
            if (err) return reject(err);
            resolve({
                payment,
                info: get_payment_details(payment)
            });
        });
    });
}


function execute_payment(paymentId, payerId) {
    return new Promise((resolve, reject) => {
        paypal.payment.execute(paymentId, {payer_id: payerId}, (err, payment) => {
            if (err) return reject(err);
            resolve(payment);
        });
    });
}


module.exports = {
    create_payment,
    execute_payment,
};
