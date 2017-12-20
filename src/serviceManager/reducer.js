import {SERVICE_SET} from './actions'

export default function reducer (state, action) {
    switch (action.type) {
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