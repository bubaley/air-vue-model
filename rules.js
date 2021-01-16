const rules = {
    email: value => {
        const pattern = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        return pattern.test(value) || 'Некорректный e-mail'
    },
    required: value => !!value || 'Поле обязательно для заполнения',
    match: p => v => (v || '') === p || 'Пароли должны совпадать',
    length: p => v => v.length >= p || `Минимальная длина ${p}`,
    dateRange: v => text => {
        if (v.length !== 2 || !v[0] || !v[1])
            return 'Неверный период'
        return true
    },
    date: v => text => {
        if (!v)
            return 'Неверная дата'
        return true
    },
    password: (value) => {
        const pattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!"#$%&'()*+,-.\/:;<=>?@\[\\\]^_`{|}~]{2,}$/;
        return pattern.test(value) || 'Пароль должен содержать буквы и цифры';
    },
    phone: (v) => v.length === 0 || (v.length === 12 && v.includes('+79')) || 'Номер введен некорректно',
    minLen: (p) => (v) => v.length >= p || `Минимальная длина ${p}`,
    // phone: v => v[4] === '9' || 'Некорректный номер телефона',
    // phoneLength: val => val.length === 17 || `Длина должна составлять 11 символа`,
}

module.exports = rules