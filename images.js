const m = {
    settings: {
        convertToBase64: false
    },
    func: null
}

m.uploadImage = (func, settings) => {
    m.func = func
    Object.assign(m.settings, settings)
    const input = document.createElement('input')
    input.setAttribute('hidden', 'true')
    input.setAttribute('type', 'file')
    input.setAttribute('id', 'image-input')
    input.setAttribute('accept', 'image/jpeg, image/png')
    document.body.appendChild(input)
    input.addEventListener('input', m.setImage)
    input.click()
}

m.setImage = async () => {
    const input = document.getElementById('image-input')
    const files = input.files
    if (files.length === 0) {
        input.remove()
        return
    }
    let file = files[0]
    input.remove()
    if (m.settings.convertToBase64) {
        file = await m.readFileToBase64(file)
    }
    m.func(file)
}

m.readFileToBase64 = file => {
    return new Promise((resolve, reject) => {
        let reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
            resolve(reader.result)
        }
        reader.onerror = reject
    })
}


module.exports = m