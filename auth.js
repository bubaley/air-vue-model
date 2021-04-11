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

self.me = async () => {
    return new Promise(async (resolve, reject) => {
        // Get tokens from local storage
        let {access, refresh} = self.getTokens()
        if (access) {
            // set auth header to axios
            self.setAuthorizationHeader(access)
            try {
                // try auth with current access
                await self.loadUser()
                resolve()
                return
            } catch {
                // clear access token
                access = null
            }
        }
        // update tokens with current refresh
        if (!access && refresh) {
            try {
                let tokens = await self.refresh()
                access = tokens.access
            } catch {
                reject()
                return
            }
        }
        // clear tokens and user
        if (!access && !refresh) {
            self.logout().then(() => {
                reject()
            })
            return
        }
        // try load user with new access after refresh tokens
        if (access) {
            try {
                await self.loadUser()
                resolve()
            } catch {
                reject()
            }
        }
    })
}

self.loadUser = () => {
    return new Promise((resolve, reject) => {
        axios.get(self.urls.me)
            .then(response => {
                self.user = response.data
                resolve(self.user)
            }).catch(() => {
            // remove auth token from local storage and axios
            self.removeToken(self.authorization.access)
            self.deleteAuthorizationHeader()
            reject()
        })
    })
}

self.login = async (data) => {
    await self.logout()
    return new Promise((resolve, reject) => {
        axios.post(self.urls.login, data).then(response => {
            const access = response.data[self.authorization.access]
            const refresh = response.data[self.authorization.refresh]
            self.setTokens(access, refresh)
            self.me().then(() => {
                resolve()
            }).catch(() => {
                reject()
            })
        }).catch(error => {
            reject(error.response)
        })
    })
}

self.register = async (data) => {
    await self.logout()
    return new Promise((resolve, reject) => {
        axios.post(self.urls.register, data).then(response => {
            self.user = response.data
            self.login(data).then(tokens => {
                resolve({
                    user: response.data,
                    tokens: tokens
                })
            })
        }).catch(error => {
            reject(error.response)
        })
    })
}

self.refresh = async () => {
    return new Promise((resolve, reject) => {
        const refresh = self.getTokens().refresh
        if (refresh) {
            axios.post(self.urls.refresh, {
                refresh
            }).then(response => {
                const access = response.data[self.authorization.access]
                const refresh = response.data[self.authorization.refresh]
                self.setTokens(access, refresh)
                self.setAuthorizationHeader(access)
                resolve({
                    access, refresh
                })
            }).catch(error => {
                self.logout().then(() => {
                    reject(error.response)
                })
            })
        } else {
            self.logout().then(() => {
                reject()
            })
        }
    })
}


self.logout = async () => {
    return new Promise((resolve, reject) => {
        axios.defaults.headers.common = {Authorization: null}
        localStorage.removeItem(self.authorization.access)
        localStorage.removeItem(self.authorization.refresh)
        self.user = null
        resolve()
    })
}

self.removeToken = (token) => {
    if (token)
        localStorage.removeItem(token)
}

self.setTokens = (access = null, refresh = null) => {
    if (access)
        localStorage.setItem(self.authorization.access, access)
    if (refresh)
        localStorage.setItem(self.authorization.refresh, refresh)
}

self.getTokens = () => {
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

self.getAuthorizationHeader = (access = null) => {
    if (!access)
        access = self.getTokens().access
    if (!access)
        return {}
    const authorization = {}
    let tokenView = ''
    if (self.authorization.authorizationType)
        tokenView = `${self.authorization.authorizationType} `
    tokenView += access
    authorization[self.authorization.authorizationKey] = tokenView
    return authorization
}

self.setAuthorizationHeader = (access = null) => {
    Object.assign(axios.defaults.headers.common, self.getAuthorizationHeader(access))
}

self.deleteAuthorizationHeader = () => {
    delete axios.defaults.headers.common[self.authorization.authorizationKey]
}

module.exports = self