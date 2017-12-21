import {bus, proxy, log, error, debug} from '@theatersoft/bus'
import {Config} from '../config'
import {createStore, applyMiddleware} from 'redux'
import thunk from 'redux-thunk'
import {composeWithDevTools} from 'remote-redux-devtools'
import {serviceSet, api} from './actions'
import reducer from "./reducer"

export class ServiceManager {
    constructor (services) {
        this.state = {services}
        this.store = createStore(reducer, {services},
            (true && composeWithDevTools({name: 'Service', realtime: true, port: 6400, hostname: 'localhost'}) || (x => x))
            (applyMiddleware(thunk.withExtraArgument({manager: this}))))
        bus.registerObject('Service', this, undefined, {sender: true})
            .then(obj => {
                obj.signal('start')
                this.store.subscribe(() => obj.signal('state', this.store.getState()))
            })
    }

    servicePath = name => this.store.getState().services[name].path

    dispatch (action) {return this.store.dispatch(api(action))}

    getState () {return this.store.getState()}

    registerServices (ids, path) {
        debug('registerService', {ids, path})
        ids.forEach(id => this.store.dispatch(serviceSet({id, path})))
    }

    setService (id, value) {
        debug('serviceSet', {id, value})
        this.store.dispatch(serviceSet({id, value}))
    }

    startService (name) {
        return bus.request(`${this.servicePath(name)}service.startService`, name)
    }

    stopService (name) {
        return bus.request(`${this.servicePath(name)}service.stopService`, name)
    }
}
