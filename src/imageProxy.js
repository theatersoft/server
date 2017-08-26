import {error} from '@theatersoft/bus'
import {Config} from './config'
import {checkSession} from './session'
import request from 'request'
import {bus} from '@theatersoft/bus'
const DEV = process.env.NODE_ENV === 'development'
import url from 'url'

const host = process.env.BUS && url.parse(process.env.BUS).host

export default {
    get (req, res) {
        const cam = Config.cameras[req.params.name]
        if (cam) {
            const url = bus.root
                ? `http://${Config.hosts[cam.host].host}:${5400 + Number(cam.device)}`
                : `https://${host}${req.originalUrl}`;
            (DEV ? Promise.resolve(true) : checkSession(req))
                .then(found => {
                    if (!found) return res.send(401)
                    request({url, method: "GET", headers: {cookie: req.headers.cookie}})
                        .on('error', e => error('imageProxy pipe error', cam, e))
                        .pipe(res)
                })
        }
    }
}
