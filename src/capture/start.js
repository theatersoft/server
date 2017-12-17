'use strict'
const
    {bus} = require('@theatersoft/bus'),
    {LocalServiceManager} = require('@theatersoft/server/lib'),
    name = `capture.${require('os').hostname()}`,
    options = {
        module: '@theatersoft/server/capture/capture',
        export: 'Capture',
        name
    }
bus.start().then(() => new LocalServiceManager(
    name,
    {[name]: {options}}
))
process.on('SIGINT', () => process.exit())
process.on('exit', () => service.stop())