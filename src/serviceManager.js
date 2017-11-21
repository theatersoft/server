import {bus, proxy, log, error, debug} from '@theatersoft/bus'
import {Config} from './config'
import {createStore, applyMiddleware} from 'redux'
import thunk from 'redux-thunk'
import {composeWithDevTools} from 'remote-redux-devtools'

export class ServiceManager {
    constructor (services) {
        this.state = {services, hosts: {}}
    }

    _updatePath = name =>
        bus.resolveName(name)
            .then(path => this.services[name].path = path)

    getState () {
        return this.state
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

    registerHost (host, path) {
        debug('@@@ registerHost', host, path)
        this.state = {
            ...this.state,
            hosts: {
                ...this.state.hosts,
                [host]: {...this.state.hosts[host], path}
            }
        }
    }

    setService ({name, host, running}, path) {
        debug('@@@ registerService', name, host, path)
    }
}
