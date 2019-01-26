const info = {
    astro_turf: {
        price: 10,
        opening_hours: [
            // opening times - closing times
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


function get_price(venue) {
    return info[venue].price;
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
