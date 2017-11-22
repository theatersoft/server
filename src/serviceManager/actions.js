export const
    HOST_SET = 'HOST_SET',
    hostSet = host => ({type: HOST_SET, host}),
    SERVICE_SET = 'SERVICE_SET',
    serviceSet = service => ({type: SERVICE_SET, service}),

    api = action => (dispatch, getState, {manager}) => {
        const
            {id, type} = action
        switch (type) {
        case ON:
        case OFF:
            return manager[type === ON ? startService : stopService](id)
        }
        throw 'unknown action '
    }