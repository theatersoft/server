import {bus, proxy, log, error} from '@theatersoft/bus'
import {Config} from './config'

class LocalServiceManager {
    constructor (services = [], configs = {}) {
        this.services = services.reduce((o, options) => (o[options.name] = {
            options: {config: {...options.config, ...configs[options.name]}, ...options}
        }, o), {})
        Object.values(this.services)
            .forEach(({options}) => options.enabled !== false && this.startService(options.name))
    }

    getServiceState (name) {}

    startService (name) {
        const service = this.services[name]
        if (!service) throw `Failed to start service ${name}`
        if (service.instance) throw`Service already running ${name}`
        try {
            const {options} = service
            service.instance = new (require(options.module)[options.export])()
            log(`Starting service ${options.name}`)
            service.instance.start(options)
                .then(() => log(`Started service ${name}`))
                .catch(e => {
                    delete service.instance
                    error(`Failed to start service ${name} ${e}`)
                })
        } catch (e) {
            error(`Failed to start service ${name} ${e}`)
        }
    }

    stopService (name) {}
}

class ServiceManager {}

Config.started
    .then(config => new LocalServiceManager(Config.host.services, config.configs))
