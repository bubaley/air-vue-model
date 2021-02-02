const currency = {
    getNumber: (number, precision = 2) => {
        if (number === 0)
            return 0
        if (!number)
            return null
        return parseFloat(number.toFixed(precision))
    }
}