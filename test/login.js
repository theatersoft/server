'use strict'
require('./rpc').rpc('Session.Login', ['0000'])
    .then(r => {
        console.log('Session.Login returned', r)
    }, e => {
        console.log('Session.Login rejected', e)
    })

