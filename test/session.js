'use strict'
const {createSession} = require('@theatersoft/server')

createSession('name', 'ip', 'ua')
    .then(r => {
        console.log('createSession returned', r)
    }, e => {
        console.log('createSession rejected', e)
    })

