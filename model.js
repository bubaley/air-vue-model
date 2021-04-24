module.exports = function () {

    const self = {
        name: '',
        url: '',
        routes: [],
        list: [],
        item: null,
        default: {
            name: null
        },
        filters: {
            search: null,
        },
        filterBy: [],
        pagination: {
            _page: 1,
            _page_size: 20,
            total: 0,
            last_page: 1
        },
        texts: {
            list: null,
            description: null,
            item: null
        },
        pk: 'id'
    }

    self.loadList = (params = {}, settings = {}) => {
        return self._loadList(params, settings)
    }

    self.loadItem = (pk, settings = {}) => {
        return self._loadItem(pk, settings)
    }

    self.create = (data = null) => {
        return self._create(data)
    }

    self.update = (data = null) => {
        return self._update(data)
    }

    self.updateOrCreate = (data = null) => {
        return self._updateOrCreate(data)
    }

    self.destroy = (id = null) => {
        return self._destroy(id)
    }

    self.send = (action, pk = null, data = {}, method = 'post', headers = {}) => {
        return self._send(action, pk, data, method, headers)
    }

    self.getFilters = () => {
        return self._getFilters()
    }

    self.sendPostSingle = (action, pk, data, headers) => self.send(action, pk, data, 'post', headers)
    self.sendPost = (action, data, headers) => self.send(action, null, data, 'post', headers)
    self.sendGetSingle = (action, pk, params, headers) => self.send(action, pk, params, 'get', headers)
    self.sendGet = (action, params, headers) => self.send(action, null, params, 'get', headers)

    self.setPagination = pagination => {
        self.pagination._page = pagination.page || self.pagination._page
        self.pagination._page_size = pagination.page_size || self.pagination._page_size
        self.pagination.total = pagination.total || self.pagination.total
        self.pagination.last_page = pagination.last_page || self.pagination.last_page
    }

    self.copy = item => {
        item = item || self.item
        return window._.cloneDeep(item)
    }

    self.setItemFromDefault = () => {
        self.item = self.copy(self.default)
    }

    self.findBy = (key, value, list = null) => {
        list = list || self.list
        return list.find(el => el[key] === value)
    }

    self.findIndexBy = (key, value, list = null) => {
        list = list || self.list
        return list.findIndex(el => el[key] === value)
    }

    self.deleteBy = (key, value, list = null) => {
        list = list || self.list
        const index = self.findIndexBy(key, value, list)
        if (index > -1)
            list.splice(index, 1)
    }

    self.findByPk = (pk, list = null) => {
        return self.findBy(self.pk, pk, list)
    }

    self.findIndexByPk = (pk, list = null) => {
        return self.findIndexBy(self.pk, pk, list)
    }

    self.deleteByPk = (pk, list = null) => {
        self.deleteBy(self.pk, pk, list)
    }

    const _getRoutes = (routes) => {
        const newRoutes = []
        routes.forEach(route => {
            let {component, path, name, model, redirect, children, single, ...meta} = route

            model = model || self
            meta.model = model
            if (typeof path !== 'string')
                path = model.url
            if (single) {
                meta.param = `${model.name}${self.pk.charAt(0).toUpperCase() + self.pk.slice(1)}`
                meta.single = true
                path += `/:${meta.param}`
            }

            const newRoute = {
                name: self.name + name.charAt(0).toUpperCase() + name.slice(1),
                path,
                component: component.default || component,
                meta
            }

            if (redirect)
                newRoute.redirect = redirect
            if (Array.isArray(children))
                newRoute.children = _getRoutes(children)

            newRoutes.push(newRoute)
        })
        return newRoutes
    }

    self.getRoutes = () => _getRoutes(self.routes)

    self._loadItem = (pk, settings = {}) => {
        return new Promise((resolve, reject) => {
            if (pk === 'new') {
                self.item = window._.cloneDeep(self.default)
                resolve()
            } else if (pk) {
                window.axios.get(`/${self.url}/${pk}/`)
                    .then(response => {
                        if (settings.setToModel !== false)
                            self.item = response.data
                        resolve(response.data)
                    }).catch(error => reject(error.response))
            } else reject()
        })
    }

    self._getFilters = () => {
        const filters = {}
        for (const [key, value] of Object.entries(self.filters)) {
            if (value !== null) {
                if (!self.filterBy.length || (self.filterBy.length && self.filterBy.indexOf(key) > -1))
                    filters[key] = value
            }
        }
        return filters
    }

    self._loadList = (params = {}, settings = {}) => {
        return new Promise((resolve, reject) => {
            if (settings.setFirstPage !== false)
                self.setPagination({page: 1})
            let defaultParams = {
                page: self.pagination.page,
                page_size: self.pagination.page_size
            }
            const filters = self.getFilters()
            const newParams = Object.assign(defaultParams, filters, params)
            window.axios.get(`/${self.url}/`, {
                params: newParams
            }).then(response => {
                if (settings.setToModel !== false) {
                    const {total, page, last_page, results} = response.data
                    self.setPagination({total, page, last_page})
                    self.list = results
                    resolve(results)
                } else
                    resolve(response.data)
            }).catch(error => reject(error.response))
        })
    }

    self._create = (data = null) => {
        return new Promise((resolve, reject) => {
            window.axios.post(`/${self.url}/`, data || self.item)
                .then(response => {
                    self.item = response.data
                    resolve(self.item)
                }).catch(error => reject(error.response))
        })
    }

    self._update = (data = null) => {
        return new Promise((resolve, reject) => {
            data = data || self.item
            if (!data[self.pk])
                reject()
            window.axios.put(`/${self.url}/${data[self.pk]}/`, data)
                .then(response => {
                    self.item = response.data
                    resolve(response.data)
                }).catch(error => reject(error.response))
        })
    }

    self._updateOrCreate = (data = null) => {
        data = data || self.item
        if (data.id)
            return {
                promise: self.update(data),
                created: false
            }
        else
            return {
                promise: self.create(data),
                created: true
            }
    }

    self._destroy = (pk = null) => {
        return new Promise((resolve, reject) => {
            if (!pk && self.item && self.item[self.pk])
                pk = self.item[self.pk]
            if (!pk)
                reject()
            window.axios.delete(`/${self.url}/${pk}/`)
                .then(() => {
                    resolve()
                })
                .catch(error => reject(error.response))
        })
    }

    self._send = (action = null, pk = null, data = {}, method = 'post', headers = {}) => {
        let currentUrl = self.url ? `/${self.url}/` : '/'
        if (pk)
            currentUrl += `${pk}/`
        if (action)
            currentUrl += `${action}/`

        return new Promise((resolve, reject) => {
            window.axios({
                method: method,
                url: currentUrl,
                data: method === 'post' ? data : null,
                params: method === 'get' ? data : null,
                headers: headers
            })
                .then((response) => {
                    resolve(response.data)
                })
                .catch((error) => {
                    reject(error.response)
                })
        })
    }

    Object.defineProperty(self.pagination, 'page', {
        get: () => {
            return self.pagination._page
        },
        set: (val) => {
            self.pagination._page = val
            self.loadList({}, {
                setFirstPage: false
            })
        }
    })
    Object.defineProperty(self.pagination, 'page_size', {
        get: () => {
            return self.pagination._page_size
        },
        set: (val) => {
            self.pagination._page_size = val
            self.loadList({}, {
                setFirstPage: false
            })
        }
    })

    return self
}