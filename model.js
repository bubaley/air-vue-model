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
        search: '',
        pagination: {
            page: 1,
            total: 0,
            page_size: 20,
            last_page: 1
        },
        info: {},
        configuration: {},
    }

    self.loadList = (params) => {
        return new Promise((resolve, reject) => {
            let defaultParams = {
                page: self.pagination.page,
                page_size: self.pagination.page_size,
                search: self.search
            }
            const newParams = Object.assign(defaultParams, params)
            window.axios.get(`/${self.url}/`, {
                params: newParams
            }).then(response => {
                const {total, page, last_page, results} = response.data
                self.setPagination({total, page, last_page})
                self.list = results
                resolve(results)
            }).catch(() => {
                reject()
            })
        })
    }

    self.loadItem = (id) => {
        return new Promise((resolve, reject) => {
            if (id === 'new') {
                self.item = window._.cloneDeep(self.default)
                resolve()
            } else if (parseInt(id)) {
                window.axios.get(`/${self.url}/${id}/`)
                    .then(response => {
                        self.item = response.data
                        resolve(response.data)
                    }).catch(error => reject(error))
            } else reject()
        })
    }

    self.create = (data = null) => {
        return new Promise((resolve, reject) => {
            window.axios.post(`/${self.url}/`, data || self.item)
                .then(response => {
                    self.item = response.data
                    resolve(self.item)
                }).catch(error => reject(error))
        })
    }

    self.update = (data = null) => {
        return new Promise((resolve, reject) => {
            data = data || self.item
            if (!data.id)
                reject()
            window.axios.put(`/${self.url}/${data.id}/`, data)
                .then(response => {
                    self.item = response.data
                    resolve(response.data)
                }).catch(error => reject(error))
        })
    }

    self.createOrUpdate = (data = null) => {
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

    self.destroy = (id = null) => {
        return new Promise((resolve, reject) => {
            if (!id && self.item && self.item.id)
                id = self.item.id
            if (!id)
                reject()
            window.axios.delete(`/${self.url}/${id}/`)
                .then(() => {
                    resolve()
                })
                .catch(error => reject(error))
        })
    }

    self.send = (data, action, id = null, method = 'post') => {

        const url = id ? `/${self.url}/${id}/${action}/` : `/${self.url}/${action}/`

        return new Promise((resolve, reject) => {
            window.axios({
                method: method,
                url: url,
                data: method === 'post' ? data : null,
                params: method === 'get' ? data : null
            })
                .then((response) => {
                    resolve(response.data)
                })
                .catch((error) => {
                    reject(error)
                })
        })
    }

    self.sendPostSingle = (data, action, id) => self.send(data, action, id)
    self.sendPost = (data, action) => self.send(data, action)
    self.sendGetSingle = (params, action, id) => self.send(params, action, id, 'get')
    self.sendGet = (params, action) => self.send(params, action, null, 'get')

    self.setPagination = (pagination) => {
        for (const el in pagination) {
            if (pagination.hasOwnProperty(el))
                self.pagination[el] = pagination[el]
        }
    }

    self.setItemFromDefault = () => {
        self.item = window._.cloneDeep(self.default)
    }

    self.findBy = (key, value) => {
        return self.list.find(el => el[key] === value)
    }

    self.findById = (id) => {
        return self.findBy('id', id)
    }

    self.deleteById = (id) => {
        const index = self.list.findIndex(el => el.id === id)
        if (index > -1)
            self.list.splice(index, 1)
    }

    self.getRoutes = routes => {
        const result = []
        if (!routes)
            routes = self.routes
        routes.forEach(route => {
            let {component, path, name, model, redirect, children, ...meta} = route
            model = model || self
            component = component.default || component
            redirect = redirect || undefined
            path = path || meta.single ? `${model.url}/:${model.name}Id` : model.url
            name = self.name + name.charAt(0).toUpperCase() + name.slice(1)
            if (Array.isArray(children)) {
                children = self.getRoutes(children)
            } else
                children = undefined
            meta.model = model || self
            meta.param = meta.single ? `${self.name}Id` : null
            result.push({
                component,
                path,
                name,
                redirect,
                children,
                meta
            })
        })
        return result
    }

    return self
}