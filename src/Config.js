'use strict'
const
    {bus, executor, proxy} = require('@theatersoft/bus'),
    log = require('./Log'),
    fs = require('fs'),
    os = require('os'),
    read = () => JSON.parse(fs.readFileSync(`${process.env.HOME}/.config/theatersoft/config.json`, 'utf8')),
    loaded = executor(),
    cameras = {},
    hosts = {},
    hostname = os.hostname()

let config, host

bus.started()
    .then(() => {
        (bus.root ? Promise.resolve(read()) : proxy('Config').get())
            .then(config_ => {
                config = config_
                console.log('Config', hostname, config)

                // hosts map
                config.hosts.forEach(h => {
                    hosts[h.name] = h
                    if (h.name === hostname) {
                        if (bus.root) h.root = true
                        host = h
                    }
                })

                // camera map
                config.hosts.forEach(h => {
                    h.cameras && h.cameras.forEach(cam => {
                        cam.host = h.name
                        cameras[cam.name] = cam
                    })
                })
                loaded.resolve()
                bus.root && bus.registerObject('Config', Config)
            })
    })

const Config = new class {
    get () {
        log.log('bus Config.get')
        return config
    }

    getHost () {
        log.log('bus Config.getHost')
        return host
    }
}

module.exports = {
    get loaded () {
        return loaded.promise
    },

    get config () {return config},

    get host () {return host},

    get hostname () {return hostname},

    get hosts () {return hosts},

    get cameras () {return cameras},

    rpc: {
        Get () {
            console.error('deprecated Config.get')
            return config
        }
    }
}
