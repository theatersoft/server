import {bus, proxy, log, error, debug} from '@theatersoft/bus'
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
    constructor (services) {
        this.services = services
        Object.keys(services).forEach(this._updatePath)
    }

    _updatePath = name =>
        bus.resolveName(name)
            .then(path => this.services[name].path = path)

    getServices (name) {
        return name ? this.services[name] : this.services
    }

    async startService (name) {
        // if bus registered, start service
        // bus registered???

        // get host path, LSM start service
        const service = this.services[name]
        if (service) {
            if (!service.path) await this._updatePath(name)
            await bus.request(`path``service.startService`, name)
        }
    }

    async stopService (name) {
        const service = this.services[name]
        if (service) {
            if (!service.path) await this._updatePath(name)
            await bus.request(`path``service.stopService`, name)
        }
    }

    //registerService (name, host, path) {
    //
    //}
}

Config.started
    .then(config => {
        new LocalServiceManager(Config.host.services, config.configs)
        if (bus.root) {
            const services = config.hosts
                .reduce((a, {name: host, services}) => (
                    services && a.push(...services.map(
                        ({name, enabled = true}) => ({name, host, enabled})
                    )), a
                ), [])
                .reduce((o, s) => (o[s.name] = s, o), {})
            bus.registerObject('Service', new ServiceManager(services))
        }
    })
