const closing_info = {
    astro_turf: [
        // opening times - closing times
        [[10, 00], [12, 30]], // Sun
        [[18, 00], [21, 30]], // Mon
        [[18, 00], [21, 30]], // Tue
        [[18, 00], [21, 30]], // Wed
        [[18, 00], [21, 30]], // Thu
        [[18, 00], [21, 30]], // Fri
        [[10, 00], [16, 30]], // Sat
    ],
};


function within_closing_times(venue, m) {
    let s = m.clone();
    let e = m.clone();
    const [[sh, sm], [eh, em]] = closing_info[venue][m.day()];
    s.hours(sh); s.minutes(sm);
    e.hours(eh); e.minutes(em);
    return m.isSameOrAfter(s) && m.isSameOrBefore(e);
}


module.exports = {
    within_closing_times,
};
