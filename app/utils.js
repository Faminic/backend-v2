const moment = require('moment');


function momentToCalendarDate(m) {
    return (m || moment()).utc().toISOString();
}


function clientDateToMoment(s) {
    const m = moment.utc(s, "YYYY-MM-DDTHH:mm:ss");
    if (!m.isValid()) {
        throw new Error("invalid date!");
    }
    // round to nearest half-hour
    return roundToHalfHour(m);
}


function roundToHalfHour(m) {
    const remainder = m.minute() % 30;
    m.subtract(remainder, "minutes");
    m.seconds(0);
    return m;
}


function today() {
    var d = new Date();
    d.setHours(0);
    d.setMinutes(0);
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d;
}


function StatusError(status) {
    this.status = status;
    this.StatusError = true;
}


function catch_errors(res) {
    return (err) => {
        if (err.StatusError) {
            res.status(err.status);
            res.end();
            return;
        }
        console.error(err);
        res.status(500);
        res.end();
    };
}


module.exports = {
    momentToCalendarDate,
    clientDateToMoment,
    catch_errors,
    StatusError,
    today,
};
