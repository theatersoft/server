import {HOST_SET} from './actions'

export default function reducer (state, action) {
    switch (action.type) {
    case HOST_SET:
    {
        const {host, path} = action
        return {
            ...state, hosts: {
                ...state.hosts, [host]: {
                    ...state.hosts[host], path
                }
            }
        }
    }
    }
    return state
}