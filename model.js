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
            page: 1,
            total: 0,
            page_size: 20,
            last_page: 1
        },
        texts: {
            list: null,
            description: null,
            item: null
        },
    }

    self.loadList = params => {
        return self._loadList(params)
    }

    self.loadItem = id => {
        return self._loadItem(id)
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

    self.send = (action, id = null, data = {}, method = 'post', headers = {}) => {
        return self._send(action, id, data, method, headers)
    }

    self.getFilters = () => {
        return self._getFilters()
    }

    self.sendPostSingle = (action, id, data, headers) => self.send(action, id, data, 'post', headers)
    self.sendPost = (action, data, headers) => self.send(action, null, data, 'post', headers)
    self.sendGetSingle = (action, id, params, headers) => self.send(action, id, params, 'get', headers)
    self.sendGet = (action, params, headers) => self.send(action, null, params, 'get', headers)

    self.setPagination = (pagination) => {
        for (const el in pagination) {
            if (pagination.hasOwnProperty(el))
                self.pagination[el] = pagination[el]
        }
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

    self.findById = (id, list = null) => {
        return self.findBy('id', id, list)
    }

    self.findIndexById = (id, list = null) => {
        return self.findIndexBy('id', id, list)
    }

    self.deleteById = (id, list = null) => {
        self.deleteBy('id', id, list)
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
                meta.param = `${model.name}Id`
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

    self._loadItem = (id, setToModel = true) => {
        return new Promise((resolve, reject) => {
            if (id === 'new') {
                self.item = window._.cloneDeep(self.default)
                resolve()
            } else if (id) {
                window.axios.get(`/${self.url}/${id}/`)
                    .then(response => {
                        if (setToModel)
                            self.item = response.data
                        resolve(response.data)
                    }).catch(error => reject(error.response))
            } else reject()
        })
    }

    self._getFilters = () => {
        const filters = {}
        for (const [key, value] of Object.entries(self.filters)) {
            if (value || value === 0) {
                if (!self.filterBy.length || (self.filterBy.length && self.filterBy.indexOf(key) > -1))
                    filters[key] = value
            }
        }
        return filters
    }

    self._loadList = (params, setToModel = true) => {
        return new Promise((resolve, reject) => {
            let defaultParams = {
                page: self.pagination.page,
                page_size: self.pagination.page_size
            }
            const filters = self.getFilters()
            const newParams = Object.assign(defaultParams, filters, params)
            window.axios.get(`/${self.url}/`, {
                params: newParams
            }).then(response => {
                if (setToModel) {
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
            if (!data.id)
                reject()
            window.axios.put(`/${self.url}/${data.id}/`, data)
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

    self._destroy = (id = null) => {
        return new Promise((resolve, reject) => {
            if (!id && self.item && self.item.id)
                id = self.item.id
            if (!id)
                reject()
            window.axios.delete(`/${self.url}/${id}/`)
                .then(() => {
                    resolve()
                })
                .catch(error => reject(error.response))
        })
    }

    self._send = (action = null, id = null, data = {}, method = 'post', headers = {}) => {
        let currentUrl = self.url ? `/${self.url}/` : '/'
        if (id)
            currentUrl += `/${id}/`
        if (action)
            currentUrl += `/${action}/`

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

    return self
}