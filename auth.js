const axios = window && window.axios ? window.axios : require('./axios')

const self = {}
self.user = null
self.actions = []
self.urls = {
    login: '/token/',
    me: '/users/me/',
    register: '/users/',
    refresh: '/token/refresh/'
}

self.authorization = {
    access: 'access',
    refresh: 'refresh',
    authorizationType: 'Bearer',
    authorizationKey: 'Authorization'
}

self.hasRight = (data) => {
    if (!self.user)
        return false
    if (self.user && self.user.is_superuser)
        return true
    return !!self.actions.find(action => action.group_name === data[0] && action.name === data[1])
}

self.hasRights = (data) => {
    for (let el of data) {
        if (!self.hasRight(el))
            return false
    }
    return true
}

self.hasOneOfRights = (data) => {
    for (let el of data) {
        if (self.hasRight(el))
            return true
    }
    return false
}

self.isSuperuser = (user = null) => {
    user = user || self.user
    return user && user.is_superuser
}

self.me = async (needRefresh = true) => {
    let tokens = self.getTokensFromStorage()
    if (self.tokenIsValid(tokens.refresh) && needRefresh) {
        try {
            tokens = await self.refresh(tokens.refresh)
        } catch (e) {
        }
    }
    if (self.tokenIsValid(tokens.access)) {
        self.setAuthorizationHeader(tokens.access)
        return await self.loadUser()
    }
    self.logout()
    throw {'message': 'authorization fail'}
}

self.loadUser = async () => {
    try {
        self.user = (await axios.get(self.urls.me)).data
        return self.user
    } catch (e) {
        throw e.response
    }
}

self.login = async data => {
    self.logout()
    try {
        const tokens = (await axios.post(self.urls.login, data)).data
        const access = tokens[self.authorization.access]
        const refresh = tokens[self.authorization.refresh]
        self.setTokensToStorage(access, refresh)
        self.setAuthorizationHeader(access)
        const result = await self.loadUser()
        return {
            user: result,
            tokens: {access, refresh}
        }
    } catch (e) {
        throw e.response
    }
}

self.register = async data => {
    self.logout()
    try {
        await axios.post(self.urls.register, data)
        return await self.login(data)
    } catch (e) {
        throw e.response
    }
}

self.refresh = async token => {
    try {
        const result = (await axios.post(self.urls.refresh, {refresh: token})).data
        const tokens = {
            access: result[self.authorization.access],
            refresh: result[self.authorization.refresh]
        }
        self.setTokensToStorage(tokens.access, tokens.refresh)
        self.setAuthorizationHeader(tokens.access)
        return tokens
    } catch (e) {
        throw e.response
    }
}

self.logout = () => {
    axios.defaults.headers.common['Authorization'] = null
    localStorage.removeItem(self.authorization.access)
    localStorage.removeItem(self.authorization.refresh)
    self.user = null
}

self.removeToken = (token) => {
    if (token)
        localStorage.removeItem(token)
}

self.setTokensToStorage = (access = null, refresh = null) => {
    if (access)
        localStorage.setItem(self.authorization.access, access)
    if (refresh)
        localStorage.setItem(self.authorization.refresh, refresh)
}

self.getTokensFromStorage = () => {
    let access = localStorage.getItem(self.authorization.access)
    if (access === 'undefined') {
        self.removeToken(self.authorization.access)
        access = null
    }
    let refresh = localStorage.getItem(self.authorization.refresh)
    if (refresh === 'undefined') {
        self.removeToken(self.authorization.refresh)
        refresh = null
    }
    return {
        access, refresh
    }
}

self.getAuthorizationHeader = (access) => {
    const authorization = {}
    let tokenView = ''
    if (self.authorization.authorizationType)
        tokenView = `${self.authorization.authorizationType} `
    tokenView += access
    authorization[self.authorization.authorizationKey] = tokenView
    return authorization
}

self.setAuthorizationHeader = (access) => {
    Object.assign(axios.defaults.headers.common, self.getAuthorizationHeader(access))
}

self.deleteAuthorizationHeader = () => {
    delete axios.defaults.headers.common[self.authorization.authorizationKey]
}

self.tokenIsValid = token => {
    const currentDate = Date.now() / 1000 | 0
    try {
        const data = self.parseJwt(token)
        return currentDate < data.exp
    } catch (e) {
        return false
    }
}

self.parseJwt = token => {
    let base64Url = token.split('.')[1]
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    let jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    return JSON.parse(jsonPayload)
}

self.refreshInterval = setInterval(async () => {
    let checkDate = Date.now() / 1000 | 0
    checkDate += 60 * 60
    const tokens = self.getTokensFromStorage()
    if (self.tokenIsValid(tokens.refresh) && !self.tokenIsValid(tokens.refresh, checkDate)) {
        await self.refresh(tokens.refresh)
    }
}, 1000 * 60 * 10)

module.exports = self