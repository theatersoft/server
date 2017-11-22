import {HOST_SET, SERVICE_SET} from './actions'

export default function reducer (state, action) {
    switch (action.type) {
    case HOST_SET:
    {
        const {host} = action, {name} = host
        return {
            ...state, hosts: {
                ...state.hosts, [name]: {
                    ...state.hosts[name], ...host
                }
            }
        }
    }
    case SERVICE_SET:
    {
        const {service} = action, {name} = service
        return {
            ...state, services: {
                ...state.services, [name]: {
                    ...state.services[name], ...service
                }
            }
        }
    }
    }
    return state
}