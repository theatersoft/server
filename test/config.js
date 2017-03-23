'use strict'
const
    {bus, proxy} = require('@theatersoft/bus'),
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