'use strict'
const
    {bus} = require('@theatersoft/bus'),
    {LocalServiceManager} = require('@theatersoft/server/localServiceManager'),
    options = {
        module: '@theatersoft/server/capture/capture',
        export: 'Capture',
        name: 'capture'
    },
    service = new (require(options.module)[options.export])()

bus.start().then(() => new LocalServiceManager(
    options.name,
    {[options.name]: {options}}
))
process.on('SIGINT', () => process.exit())
process.on('exit', () => service.stop())