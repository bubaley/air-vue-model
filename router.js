module.exports = (Vue, VueRouter, routes, options = {}) => {
    Vue.use(VueRouter)

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
                next({name: 'login'})
            })
    })

    const loadItems = (to) => {
        return new Promise(async (resolve, reject) => {
            const auth = Vue.prototype.$auth
            if (to.matched[0].meta.auth && auth)
                if (!auth.user) {
                    await auth.me().catch(() => {
                        reject()
                    })
                }
            for (let value of to.matched) {
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

}

