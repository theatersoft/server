import {bus, proxy, log, error, debug} from '@theatersoft/bus'
import {createStore, applyMiddleware} from 'redux'
import thunk from 'redux-thunk'
import {composeWithDevTools} from 'remote-redux-devtools'
import {serviceSet, api} from './actions'
import reducer from "./reducer"

export class ServiceManager {
    constructor () {
        this.store = createStore(reducer, {services: {}},
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

    setServices (services, path) {
        Object.entries(services).forEach(([id, service]) => this.store.dispatch(serviceSet({...service, id, path})))
    }

    startService (name) {
        return bus.request(`${this.servicePath(name)}service.startService`, name)
    }

    stopService (name) {
        return bus.request(`${this.servicePath(name)}service.stopService`, name)
    }
}
