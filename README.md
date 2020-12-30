**AIR-VUE-MODEL**

# Table of Contents

1. [Instalation](#instalation)
2. [Model](#model)
    1. [Simple usage](#simple-usage)
    2. [Methods](#methods)
        1. [loadList](#loadlistparams)
        2. [loadItem](#loaditemid)  
        3. [create](#createdata--null)
        4. [destroy](#destroyid--null)
        5. [getRoutes](#getroutes)
    3. [Required fields](#required-fields)
    4. [Optional fields](#optional-fields)

# Instalation

`$ npm install marked`

# Model

Add folder **models** in src. Add a file to the directory that will contain the model, for example **user**.

## Simple usage

`src/models/user.js`

```javascript
const m = require('air-vue-model/model')()
m.name = "user"
m.url = "users"
module.exports = m
```

Create a **models.js** file in src and register the model in **Vue.prototype** for global use.
`src/models.js`

```javascript
import Vue from 'vue'

Vue.prototype.$user = Vue.observable(require('./models/user'))
```

## Methods

### loadList(params)

Sends a **GET** request to get the list and set it to **list**. You can pass query params to query by passing them as an
object in the method call.

```javascript
const params = {
    page_size: 15
}

this.$user.loadList(params).then(result => {
    console.log(result)
}).catch(e => {
    console.log(e)
})
```

### loadItem(id)

Sends a **GET** request to get an item, the value is set in the **item** field. If id is `"new"` then **item** will be
set to the value from **default**.

```javascript
const id = 1

this.$user.loadItem(id).then(result => {
    console.log(result)
}).catch(e => {
    console.log(e)
})
```

### create(data = null)

Sends a **POST** request to create an item. If **data** is not passed, then the value will be taken from **item**. The
new value will be set to **item**.

```javascript
const data = {
    name: "demo"
}

this.$user.create(data).then(result => {
    console.log(result)
}).catch(e => {
    console.log(e)
})
```

### update(data = null)

Sends a **POST** request to update an item. If **data** is not passed, then the value will be taken from **item**. The
updated value will be set to **item**.

```javascript
const data = {
    id: 3,
    name: "updated demo"
}

this.$user.update(data).then(result => {
    console.log(result)
}).catch(e => {
    console.log(e)
})
```

### destroy(id = null)

Sends a **DELETE** method to delete an object. If **id** is not passed, it will be taken from **item**.

```javascript
this.$user.destroy(3)
```

### getRoutes()

Get routes from **item.routes**. 
## Required fields:

- component
- name

To go to the specified route, you must specify the **name from the model** + the **name of the route**.

```javascript
// create model
const m = require('air-vue-model/model')()
m.name = "user"
m.url = "users"
m.routes = [
    {name: 'list', component: require('./components/ListUser.vue')},
    {name: 'item', component: require('./components/ItemUser.vue'), single: true}
]
module.exports = m

// push to list
this.$router.push({
    name: 'userList'
})
// push to item
this.$router.push({
    name: 'userItem',
    params: {
        userId: 3
    }
})
```

## Optional fields:

- single

If **single** is **true**, then when trying to open this path, the value will be loaded automatically using the **
loadItem** method.

- path

The default is equal to **url**, if **single** is **true**, then the following construction will be used:

```javascript
`${self.url}/:${self.name}Id`
```

- auth

Check for user presence. If the user is absent, an authorization attempt will be made. On error, an error will be thrown
in router.

- *another fields will be set in meta*
