const moment = require('moment-timezone')
moment.updateLocale('ru', {
    calendar: {
        lastDay: '[вчера,] LT',
        sameDay: '[сегодня,] LT',
        nextDay: '[завтра,] LT',
        lastWeek: 'LLL',
        nextWeek: 'LLL',
        sameElse: 'LLL',
    },
})

module.exports = moment