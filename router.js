module.exports = (Vue, VueRouter, routes, options = {}) => {
    Vue.use(VueRouter)
    let fail = next => next({name: 'login'})
    fail = options.fail || fail

    const router = new VueRouter({
        mode: 'history',
        routes,
    })

    router.beforeEach((to, from, next) => {
        loadItems(from, to)
            .then((r) => {
                next()
            })
            .catch(() => {
                fail(next)
            })
    })

    const loadItems = (from, to) => {
        return new Promise(async (resolve, reject) => {
            const auth = Vue.prototype.$auth
            for (let value of to.matched) {
                let fail = false
                if (value.meta && value.meta.auth && auth)
                    if (!auth.user) {
                        await auth.me().catch(() => {
                            reject()
                            fail = true
                        })
                    }

                if (value.meta.single && !fail) {
                    const param = value.meta.param
                    const toId = to.params[param]
                    const fromId = from.params[param]
                    if (fromId === toId)
                        continue
                    if (toId === 'new') {
                        value.meta.model.setItemFromDefault()
                    } else {
                        await value.meta.model.loadItem(toId)
                    }
                }
            }
            resolve()
        })
    }
    return router
}

