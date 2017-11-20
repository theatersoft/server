'use strict'
const
    {bus, proxy, log} = require('@theatersoft/bus'),
    Service = proxy('Service'),
    logJson = o => log(JSON.stringify(o, null, 4))

bus.start()
    .then(() => {
        Service.getState()
            .then(r => {
                logJson(r)
            }, e => {
                log('Service.getState rejected', e)
            })
    })