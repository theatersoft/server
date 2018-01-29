import {bus, proxy, log, error, debug} from '@theatersoft/bus'
import os from 'os'
const host = os.hostname()

export class LocalServiceManager {
    constructor (name, services) {
        this.name = name
        this.services = Object.entries(services).reduce((o, [k, v]) => (o[k] = {...v, host}, o), {})
        this.instances = {}
        bus.registerObject('service', this)
        const register = () =>
            bus.request('/Service.setServices', this.services)
        bus.registerListener('Service.start', register)
        bus.on('reconnect', register)
        register()
        Object.values(this.services)
            .forEach(service =>
                service.enabled !== false && this.startService(service.name)
            )
    }

    startService (name) {
        try {
            const service = this.services[name]
            if (this.instances[name]) {
                log(`Service already running ${name}`)
                return
            }
            this.instances[name] = new (require(service.module)[service.export])()
            log(`Starting service ${name}`)
            return this.instances[name].start(service)
                .then(() => {
                    this.services[name].value = true
                    bus.request('/Service.setServices', {[name]: {value: true, host}})
                    log(`Started service ${name}`)
                })
                .catch(e => {
                    delete this.instances[name]
                    error(`Failed to start service ${name} ${e}`)
                })
        } catch (e) {
            error(`Failed to start service ${name} ${e}`)
        }
    }

    stopService (name) {
        try {
            if (!this.instances[name]) {
                log(`Service not running ${name}`)
                return
            }
            log(`Stopping service ${name}`)
            return this.instances[name].stop()
                .then(() => {
                    delete this.instances[name]
                    this.services[name].value = false
                    bus.request('/Service.setServices', {[name]: {value: false}})
                    log(`Stopped service ${name}`)
                })
        } catch (e) {
            error(`Failed to stop service ${name} ${e}`)
        }
    }
}
