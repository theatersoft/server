'use strict'
//const
//    {rpc} = require('./rpc')
//
//rpc('Config.Get')
//    .then(r => {
//        console.log('Config.Get returned', r)
//    }, e => {
//        console.log('Config.Get rejected', e)
//    })

const
    {default: bus, proxy} = require('@theatersoft/bus'),
    Config = proxy('Config')

bus.start()
    .then(() => {
        Config.get()
            .then(r => {
                console.log('Config.get returned', r)
            }, e => {
                console.log('Config.get rejected', e)
            })
    })