import {switchActions} from '@theatersoft/device'
const
    {ON, OFF} = switchActions

export const
    SERVICE_SET = 'SERVICE_SET',
    serviceSet = service => ({type: SERVICE_SET, service}),

    api = action => (dispatch, getState, {manager}) => {
        const {id, type} = action
        switch (type) {
        case ON:
            return manager.startService(id)
        case OFF:
            return manager.stopService(id)
        }
        throw 'unknown action '
    }