import {bus, executor, proxy, log} from '@theatersoft/bus'

export const THEATERSOFT_CONFIG_HOME = `${process.env.XDG_CONFIG_HOME || `${process.env.HOME}/.config`}/theatersoft`

const
    fs = require('fs'),
    os = require('os'),
    read = () => JSON.parse(fs.readFileSync(`${THEATERSOFT_CONFIG_HOME}/config.json`, 'utf8')),
    started = executor(),
    cameras = {},
    hosts = {},
    hostname = os.hostname()

let config, host

bus.started()
    .then(() => {
        (bus.root ? Promise.resolve(read()) : proxy('Config').get())
            .then(config_ => {
                config = config_
                log('Config', hostname, config)

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
                started.resolve()
                bus.root && bus.registerObject('Config', Config)
            })
    })

const Config = new class {
    get () {
        log('bus Config.get')
        return config
    }

    getHost () {
        log('bus Config.getHost')
        return host
    }
}

export default {
    get started () {
        return started.promise
    },

    get config () {return config},

    get host () {return host},

    get hostname () {return hostname},

    get hosts () {return hosts},

    get cameras () {return cameras},
}
