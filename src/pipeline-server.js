'use strict'
const
    {bus, proxy} = require('@theatersoft/bus'),
    fs = require('fs'),
    read = n => {try {return fs.readFileSync(`${process.env.HOME}/.config/theatersoft/${n}`, 'utf8').trim()} catch (e) {}},
    auth = read('.auth'),
    url = read('.bus'),
    parent = {url, auth},
    imagePipeline = require('./ImagePipeline'),
    pipelines = []

bus.start({parent})
    .then(bus => {
        console.log(`bus name is ${bus.name}`)
        proxy('Config').getHost()
            .then(host => {
                host.cameras.forEach(cam => {
                    cam.pipe = imagePipeline.create(cam.device)
                })
            })
    })


process.on('exit', () => {
    pipelines.forEach(pipe => {
        pipe.destroy()
    })
})