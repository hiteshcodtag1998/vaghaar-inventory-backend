const moment = require('moment-timezone');

const getTimezoneWiseDate = (date) => {
    const parsedDate = moment.tz(date, 'YYYY-MM-DD HH:mm', moment.tz.guess()); // Parse and treat the input as local time
    const unixTimestamp = parsedDate.utc().valueOf(); // Convert to UTC timestamp
    return unixTimestamp;
};

const sendSuccess = (res, data = {}, message = 'Success', status = 200) => {
    return res.status(status).json({
        success: true,
        message,
        data,
    });
};

module.exports = {
    getTimezoneWiseDate,
    sendSuccess,
};
