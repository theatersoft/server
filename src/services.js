import {bus, proxy, log, error} from '@theatersoft/bus'
import {Config} from './config'

class LocalServiceManager {
    constructor (services = [], configs = {}) {
        this.services = services.reduce((o, options) => (o[options.name] = {
            options: {config: {...options.config, ...configs[options.name]}, ...options}
        }, o), {})
        Object.values(this.services)
            .forEach(({options}) => options.enabled !== false && this.startService(options.name))
        bus.registerObject('service', this)
    }

    getServiceState (name) {
        const service = this.services[name]
        if (!service) throw `Unknown service ${name}`
        return !!service.instance
    }

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

    stopService (name) {
        const service = this.services[name]
        if (!service) throw `Failed to start service ${name}`
        if (!service.instance) throw`Service not running ${name}`
        log(`Stopping service ${options.name}`)
        service.instance.stop()
        delete service.instance
        log(`Stopped service ${name}`)
    }
}

class ServiceManager {
    constructor () {
        // all services
    }

    getServiceState (name) {
    }

    startService (name) {
    }

    stopService (name) {
    }
}

Config.started
    .then(config => {
        new LocalServiceManager(Config.host.services, config.configs)
        if (bus.root) bus.registerObject('Service', new ServiceManager())
    })
