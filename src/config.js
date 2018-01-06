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

let _config, host

bus.started()
    .then(() => {
        (bus.root ? Promise.resolve(read()) : proxy('Config').get())
            .then(config_ => {
                _config = config_
                log('Config', hostname, _config)

                // hosts map
                _config.hosts.forEach(h => {
                    hosts[h.name] = h
                    if (h.name === hostname) {
                        if (bus.root) h.root = true
                        host = h
                    }
                })

                // camera map
                _config.hosts.forEach(h => {
                    h.cameras && h.cameras.forEach(cam => {
                        cam.host = h.name
                        cameras[cam.name] = cam
                    })
                })
                started.resolve(_config)
                bus.root && bus.registerObject('Config', new Config())
            })
    })

export class Config {
    static get started () {
        return started.promise
    }

    static get config () {return _config}

    static get host () {return host}

    static get hostname () {return hostname}

    static get hosts () {return hosts}

    static get cameras () {return cameras}

    get () {
        log('bus Config.get')
        return _config
    }

    getHost () {
        log('bus Config.getHost')
        return host
    }

    getLocalService (name, hostname) {
        const service = hosts[hostname].services
                .find(({name: n}) => n === name)
            || {name}
        Object.assign(service.config, _config.configs[name])
        return service
    }
}
