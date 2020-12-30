module.exports = (Vue, VueRouter, routes, options = {}) => {
    Vue.use(VueRouter)
    let fail = next => next({name: 'login'})
    fail = options.fail || fail

    const router = new VueRouter({
        mode: 'history',
        routes,
    })

    router.beforeEach((to, from, next) => {
        loadItems(to)
            .then((r) => {
                next()
            })
            .catch(() => {
                fail(next)
            })
    })

    const loadItems = (to) => {
        return new Promise(async (resolve, reject) => {
            const auth = Vue.prototype.$auth
            for (let value of to.matched) {

                if (value.meta && value.meta.auth && auth)
                    if (!auth.user) {
                        await auth.me().catch(() => {
                            reject()
                            break
                        })
                    }

                if (value.meta.single) {
                    const param = value.meta.param
                    const id = to.params[param]
                    if (id === 'new') {
                        value.meta.instance.setItemFromDefault()
                    } else {
                        await value.meta.instance.loadItem(id)
                    }
                }
            }
            resolve()
        })
    }
    return router
}

