module.exports = (value, list, viewFunction = null) => {
    if (!viewFunction)
        viewFunction = (val) => val.name
    const words = value.toLowerCase().split(' ')
    return list.filter(val => {
        const currentValue = viewFunction(val).toLowerCase()
        for (const word of words) {
            if (currentValue.indexOf(word) === -1)
                return false
        }
        return true
    })
}