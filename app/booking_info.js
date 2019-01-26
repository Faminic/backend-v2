const info = {
    '11_v_11_football_pitch': {
        price_per_hour: 20,
        opening_hours: [
            [[ 9, 00], [17, 00]], // Sun
            [[16, 30], [22, 00]], // Mon
            [[16, 30], [22, 00]], // Tue
            [[16, 30], [22, 00]], // Wed
            [[16, 30], [22, 00]], // Thu
            [[16, 30], [22, 00]], // Fri
            [[ 7, 00], [22, 00]], // Sat
        ],
    },
    astro_turf: {
        price_per_hour: 30,
        price_half_day: 80,  // 3 hours
        price_full_day: 120, // 8 hours
        opening_hours: [
            [[10, 00], [12, 30]], // Sun
            [[18, 00], [21, 30]], // Mon
            [[18, 00], [21, 30]], // Tue
            [[18, 00], [21, 30]], // Wed
            [[18, 00], [21, 30]], // Thu
            [[18, 00], [21, 30]], // Fri
            [[10, 00], [16, 30]], // Sat
        ],
    },
};


function get_price(venue, hours) {
    let price = 0;
    let type = best_rate(venue, hours);
    switch (type) {
        case "full_day": price = info[venue].price_full_day; break;
        case "half_day": price = info[venue].price_half_day; break;
        case "hour":     price = info[venue].price_per_hour * hours; break;
    }
    return {
        price,
        type,
    };
}


function best_rate(venue, hours) {
    const prices = info[venue];
    const full_price = prices.price_per_hour * hours;
    if (3 < hours && hours <= 7 && prices.price_full_day && prices.price_full_day < full_price) {
        return "full_day";
    }
    if (1 < hours && hours <= 3 && prices.price_half_day && prices.price_half_day < full_price) {
        return "half_day";
    }
    return "hour";
}


function within_opening_hours(venue, m) {
    let s = m.clone();
    let e = m.clone();
    const [[sh, sm], [eh, em]] = info[venue].opening_hours[m.day()];
    s.hours(sh); s.minutes(sm);
    e.hours(eh); e.minutes(em);
    return m.isSameOrAfter(s) && m.isSameOrBefore(e);
}


function is_valid_venue(venue) {
    return info.hasOwnProperty(venue);
}


module.exports = {
    within_opening_hours,
    is_valid_venue,
    get_price,
};
