const snackbar = {
    text: null,
    color: null,
    value: false,
    settings: {
        timeout: 2000,
        success: '#25C343',
        fail: '#FF5252'
    },
    fail: text => {
        snackbar.set(text, snackbar.settings.fail)
    },
    success: text => {
        snackbar.set(text, snackbar.settings.success)
    },
    set: (text, color) => {
        snackbar.text = text
        snackbar.color = color
        snackbar.value = true
    }
}

module.exports = snackbar