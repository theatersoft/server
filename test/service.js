'use strict'
const
    {bus, proxy, log} = require('@theatersoft/bus'),
    Service = proxy('Service'),
    hostname = require('os').hostname(),
    logJson = o => log(JSON.stringify(o, null, 4))

bus.start()
    .then(() => {
        Service.getServices()
            .then(r => {
                logJson(r)
            }, e => {
                log('Service.getServices rejected', e)
            })
    })