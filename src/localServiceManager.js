import {bus, proxy, log, error, debug} from '@theatersoft/bus'

export class LocalServiceManager {
    constructor (host, services) {
        this.host = host
        this.services = services
        Object.values(this.services)
            .forEach(({options}) => options.enabled !== false && this.startService(options.name))
        bus.registerObject('service', this)
        bus.request(`/Service.registerHost`, host)
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
                .then(() => {bus.request(`/Service.setService`, {name, value: true})})
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
        bus.request(`/Service.setService`, {name, value: true})
        log(`Stopped service ${name}`)
    }
}

