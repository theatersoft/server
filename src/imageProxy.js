import {error} from '@theatersoft/bus'
import {config} from './config'
import {checkSession} from './session'
import request from 'request'
const DEV = process.env.NODE_ENV === 'development'

export default {
    get (req, res) {
        const cam = config.cameras[req.params.name]
        if (cam) {
            const url = `http://${config.hosts[cam.host].host}:${5400 + Number(cam.device)}`;
            (DEV ? Promise.resolve(true) : checkSession(req))
                .then(found => {
                    if (!found) return res.send(401)
                    request({url, method: "GET"})
                        .on('error', e => error('imageProxy pipe error', cam, e))
                        .pipe(res)
                })
        }
    }
}
