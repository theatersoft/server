import {bus, proxy, log, error, debug} from '@theatersoft/bus'
import {Config} from '../config'
import {createStore, applyMiddleware} from 'redux'
import thunk from 'redux-thunk'
import {composeWithDevTools} from 'remote-redux-devtools'
import {hostSet} from './actions'
import reducer from "./reducer"

export class ServiceManager {
    constructor (services) {
        this.state = {services, hosts: {}}
        this.store = createStore(reducer, {services, hosts: {}},
            (true && composeWithDevTools({name: 'ZWave', realtime: true, port: 6400, hostname: 'localhost'}) || (x => x))
            (applyMiddleware(thunk.withExtraArgument({}))))
    }

    _updatePath = name =>
        bus.resolveName(name)
            .then(path => this.services[name].path = path)

    getState () {
        return this.store.getState()
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
        this.store.dispatch(hostSet(host, path))
        //this.state = {
        //    ...this.state,
        //    hosts: {
        //        ...this.state.hosts,
        //        [host]: {...this.state.hosts[host], path}
        //    }
        //}
    }

    setService ({name, host, running}, path) {
        debug('@@@ registerService', name, host, path)
    }
}
