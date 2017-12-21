import {bus, proxy, log, error, debug} from '@theatersoft/bus'

export class LocalServiceManager {
    constructor (name, services) {
        this.name = name
        this.services = services
        bus.registerObject('service', this)
        const register = () =>
            bus.request('/Service.registerServices', Object.values(this.services).map(s => s.options.name))
        bus.registerListener('Service.start', register)
        bus.on('reconnect', register)
        register()
        Object.values(this.services)
            .forEach(({options}) => {
                options.enabled !== false && this.startService(options.name)
            })
    }

    getServiceState (name) {
        const service = this.services[name]
        if (!service) throw `Unknown service ${name}`
        return !!service.instance
    }

    startService (name) {
        try {
            const service = this.services[name]
            if (service.instance) {
                log(`Service already running ${name}`)
                return
            }
            const {options} = service
            service.instance = new (require(options.module)[options.export])()
            log(`Starting service ${name}`)
            return service.instance.start(options)
                .then(() => {
                    bus.request('/Service.setService', name, true)
                    log(`Started service ${name}`)
                })
                .catch(e => {
                    delete service.instance
                    error(`Failed to start service ${name} ${e}`)
                })
        } catch (e) {
            error(`Failed to start service ${name} ${e}`)
        }
    }

    stopService (name) {
        try {
            const service = this.services[name]
            if (!service.instance) {
                log(`Service not running ${name}`)
                return
            }
            log(`Stopping service ${name}`)
            return service.instance.stop()
                .then(() => {
                    delete service.instance
                    bus.request(`/Service.setService`, name, false)
                    log(`Stopped service ${name}`)
                })
        } catch (e) {
            error(`Failed to stop service ${name} ${e}`)
        }
    }
}
