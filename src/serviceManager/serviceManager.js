import {bus, proxy, log, error, debug} from '@theatersoft/bus'
import {Config} from '../config'
import {createStore, applyMiddleware} from 'redux'
import thunk from 'redux-thunk'
import {composeWithDevTools} from 'remote-redux-devtools'
import {hostSet, serviceSet, api} from './actions'
import reducer from "./reducer"

export class ServiceManager {
    constructor (services) {
        this.state = {services, hosts: {}}
        this.store = createStore(reducer, {services, hosts: {}},
            (true && composeWithDevTools({name: 'Service', realtime: true, port: 6400, hostname: 'localhost'}) || (x => x))
            (applyMiddleware(thunk.withExtraArgument({manager: this}))))
    }

    getState () {return this.store.getState()}

    setHost (id, path) {this.store.dispatch(hostSet({id, path}))}

    setService (id, value, path) {this.store.dispatch(serviceSet({id, value, path}))}

    dispatch (action) {return this.store.dispatch(api(action))}

    async startService (name) {
        const {services: {[name]: service}} = this.store.getState()
        if (!service) throw 'unknown service'
        if (service.path) {
            await bus.request(`${service.path}service.startService`, name)
        }
    }

    async stopService (name) {
        const {services: {[name]: service}} = this.store.getState()
        if (!service) throw 'unknown service'
        if (service.path) {
            await bus.request(`${service.path}service.stopService`, name)
        }
    }
}
