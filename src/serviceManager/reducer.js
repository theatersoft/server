import {HOST_SET, SERVICE_SET} from './actions'

export default function reducer (state, action) {
    switch (action.type) {
    case HOST_SET:
    {
        const {host} = action, {id} = host
        return {
            ...state, hosts: {
                ...state.hosts, [id]: {
                    ...state.hosts[id], ...host
                }
            }
        }
    }
    case SERVICE_SET:
    {
        const {service} = action, {id} = service
        return {
            ...state, services: {
                ...state.services, [id]: {
                    ...state.services[id], ...service
                }
            }
        }
    }
    }
    return state
}