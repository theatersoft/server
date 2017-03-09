'use strict'
const
    {bus} = require('@theatersoft/bus'),
    options = {
        module: '@theatersoft/server/capture/capture',
        export: 'Capture'
    },
    service = new (require(options.module)[options.export])()

bus.start().then(() => service.start())
process.on('SIGINT', () => process.exit())
process.on('exit', () => service.stop())