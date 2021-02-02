const m = require('moment-timezone')
m.updateLocale('ru', {
    calendar: {
        lastDay: '[вчера,] LT',
        sameDay: '[сегодня,] LT',
        nextDay: '[завтра,] LT',
        lastWeek: 'LLL',
        nextWeek: 'LLL',
        sameElse: 'LLL',
    },
})

m.calendarDateTime = date => moment.utc(date, 'YYYY-MM-DD HH:mm:ss').local().calendar()
m.calendarDate = date => moment.utc(date, 'YYYY-MM-DD HH:mm:ss').local().calendar().split(',')[0].replace(` ${moment().year()} г.`, '')
m.initDates = (days = 7, end_date = null) => {
    end_date = end_date || moment()
    const start_date = end_date.clone().subtract(days, 'days')
    return [start_date.format('YYYY-MM-DD'), end_date.format('YYYY-MM-DD')]
}
m.currentDate = (withTime = false) => moment().format('YYYY-MM-DD')
m.formatFromSeconds = seconds => {
    let minutes = Math.trunc(seconds / 60)
    seconds = seconds % 60
    const hours = Math.trunc(minutes / 60)
    minutes = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

m.formatToUTC = date => {
    return moment(date).utc().format('YYYY-MM-DD HH:mm:ss')
}

module.exports = m