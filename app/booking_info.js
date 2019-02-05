function get_price(product, hours) {
    let price = 0;
    let rate = best_rate(product, hours);
    switch (rate) {
        case "full_day": price = product.price_full_day; break;
        case "half_day": price = product.price_half_day; break;
        case "hour":     price = product.price_per_hour * hours;
    }
    return {
        price: price.toFixed(2),
        rate,
    };
}


function best_rate(product, hours) {
    const full_price = product.price_per_hour * hours;
    if (3 < hours && hours <= 7 && product.price_full_day && product.price_full_day < full_price) {
        return "full_day";
    }
    if (1 < hours && hours <= 3 && product.price_half_day && product.price_half_day < full_price) {
        return "half_day";
    }
    return "hour";
}


function parse_hours(str) {
    const [a, b] = str.split(":");
    return [parseInt(a), parseInt(b)];
}


function within_opening_hours(venue, m) {
    const int_to_day = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    let s = m.clone();
    let e = m.clone();
    const {open, close} = venue.opening_hours[int_to_day[m.day()]];
    const [sh, sm] = parse_hours(open);
    const [eh, em] = parse_hours(close);
    s.hours(sh); s.minutes(sm);
    e.hours(eh); e.minutes(em);
    return m.isSameOrAfter(s) && m.isSameOrBefore(e);
}


module.exports = {
    within_opening_hours,
    get_price,
};
