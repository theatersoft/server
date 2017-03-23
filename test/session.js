'use strict'
const {createSession} = require('@theatersoft/server')

const r = createSession('name', 'ip', 'ua')
console.log('createSession returned', r)

