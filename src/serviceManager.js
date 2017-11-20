import {bus, proxy, log, error, debug} from '@theatersoft/bus'
import {Config} from './config'

export class ServiceManager {
    constructor (services) {
        this.services = services
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
            await bus.request(`${service.path}service.startService`, name)
        }
    }

    async stopService (name) {
        const service = this.services[name]
        if (service) {
            if (!service.path) await this._updatePath(name)
            await bus.request(`${service.path}service.stopService`, name)
        }
    }

    //registerService (name, host, path) {
    //
    //}
}
