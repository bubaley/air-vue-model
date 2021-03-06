module.exports = (Vue, VueRouter, routes, options = {}) => {
    Vue.use(VueRouter)
    let fail = (to, from, next) => {
        window.location.href = `/login?path=${to.fullPath}`
    }
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
                fail(to, from, next)
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
                    const toPk = to.params[param]
                    const fromPk = from.params[param]
                    if (fromPk === toPk)
                        continue
                    if (toPk === 'new') {
                        value.meta.model.setItemFromDefault()
                    } else {
                        await value.meta.model.loadItem(toPk)
                    }
                }
            }
            resolve()
        })
    }
    return router
}

