module.exports = (function () {
    const axios = window && window.axios ? window.axios : require('./axios')
    const self = {}
    self.user = null
    self.actions = []

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

    self.isSuperuser = () => {
        return self.user && self.user.is_superuser
    }

    self.me = (needRefresh = true) => {
        return new Promise((resolve, reject) => {
            let access = localStorage.getItem('access')
            if (access && access !== 'undefined') {
                axios.defaults.headers.common = {Authorization: 'Bearer ' + access}
                axios.get('/users/me/')
                    .then(response => {
                        self.user = response.data
                        resolve(response.data)
                    })
                    .catch((error) => {
                        if (needRefresh) {
                            self.refresh().then(() => {
                                self.me(false).then(data => {
                                    resolve(data)
                                }).catch(() => {
                                    reject()
                                })
                            }).catch(() => {
                                reject()
                            })
                        } else {
                            reject()
                        }
                    })
            } else {
                if (needRefresh)
                    self.refresh().then(() => {
                        self.me(false).then(data => {
                            resolve(data)
                        }).catch(() => {
                            reject()
                        })
                    }).catch(() => {
                        self.logout().then(() => {
                            reject()
                        })
                    })
                else {
                    self.logout().then(() => {
                        reject()
                    })
                }
            }
        })
    }

    self.login = (data) => {
        const url = '/token/';

        return new Promise((resolve, reject) => {
            axios.post(url, data).then(response => {
                localStorage.setItem('access', response.data.access)
                localStorage.setItem('refresh', response.data.refresh)
                self.me(false).then((user) => {
                    resolve({
                        user: user,
                        tokens: response.data
                    })
                })
            }).catch(error => {
                reject(error.response)
            })
        })
    }

    self.register = (data) => {
        return new Promise((resolve, reject) => {
            axios.post('/users/', data).then(response => {
                self.user = response.data
                self.login({
                    credentials: data
                }).then(tokens => {
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

    self.refresh = () => {
        let refresh = localStorage.getItem('refresh')
        return new Promise((resolve, reject) => {
            if (refresh && refresh !== 'undefined') {
                axios.post('/token/refresh/', {
                    refresh: refresh
                }).then(response => {
                    localStorage.setItem('access', response.data.access)
                    localStorage.setItem('refresh', response.data.refresh)
                    resolve()
                }).catch(error => {
                    reject(error.response)
                })
            } else {
                reject()
            }
        })
    }

    self.logout = () => {
        return new Promise((resolve, reject) => {
            axios.defaults.headers.common = {Authorization: null}
            localStorage.removeItem('access')
            localStorage.removeItem('refresh')
            self.user = null
            resolve()
        })
    }

    return self
})()
