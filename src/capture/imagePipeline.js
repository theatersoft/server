//gst-launch v4l2src device=/dev/video0 norm=NTSC ! videorate ! video/x-raw-yuv,framerate=4/1 ! jpegenc ! multipartmux ! tcpserversink port=5400
//gst-launch tcpclientsrc port=5400 ! multipartdemux ! jpegdec ! xvimagesink
import {log, error} from '@theatersoft/bus'
import express from 'express'
import http from 'http'
import net from 'net'
import child from 'child_process'

export function Pipeline (device, base) {
    var
        app = express(),
        port = base + Number(device),
        tcpPort = port - 100,
        client,
        server,
        remaining, // if nonzero, length remaining of incompete buffer
        buffer, // incomplete buffer
        jpeg = null // current complete buffer

    // spawn gstreamer pipeline to send jpeg stream
    const spawnPipeline = cb => {
        const pipeline = `v4l2src device=/dev/cctv${device} norm=NTSC ! video/x-raw,format=YUY2,width=640,height=480,framerate=30000/1001,interlace-mode=interleaved ! deinterlace method=2 ! videorate ! video/x-raw,framerate=4/1 ! jpegenc ! multipartmux ! tcpserversink port=${tcpPort} host=127.0.0.1`
        let env = process.env
//        if (device == '3')
//            env.GST_DEBUG = 3
        log('pipeline:', pipeline)
        const gst = child.spawn('gst-launch-1.0', pipeline.split(' '), {stdio: 'inherit', env})
        gst.on('exit', code => log('pipeline exit ' + code))

        // how to wait for child init complete?
        setTimeout(cb, 1000)
    }

    // connect tcpclient to receive jpeg stream
    const connectTcp = () => {
        client = net.connect(tcpPort, () => log('client connect'))
        client.on('data', data => {
            let length = data.length, head, lines
            do {
                if (remaining) {
                    if (length <= remaining) {
                        buffer = buffer ? Buffer.concat([buffer, data]) : data
                        remaining -= length
                        length = 0
                        if (remaining == 0) {
                            jpeg = buffer
                            buffer = null
                        }
                    } else { // length longer than needed, use only remaining data
                        jpeg = buffer ? Buffer.concat([buffer, data.slice(0, remaining)]) : data.slice(0, remaining)
                        buffer = null
                        data = data.slice(remaining)
                        length -= remaining
                        remaining = 0
                    }
                }
                else { // at header
                    if (buffer) {   // previous buffer not yet parsed
                        data = Buffer.concat([buffer, data])
                        length = data.length
                        buffer = null
                    }
                    if (length < 100) { // incomplete header
                        buffer = data
                        length = 0
                    } else {    // parse header
                        head = data.toString('ascii', 0, 100),  // fast conversion
                            lines = head.split(/\r\n/)
                        if (lines.length > 0 && lines[0] == '') { // CRLF follows jpeg data
                            lines = lines.slice(1)
                            data = data.slice(2)
                            length = data.length
                        }
                        if (lines.length > 3 && lines[0] == '--ThisRandomString') {
                            remaining = Number(lines[2].slice(16))
                            var header = lines[0].length + lines[1].length + lines[2].length + 8 // 8 chars of CRLF
                            data = data.slice(header)
                            length = data.length
                        }
                    }
                }
            } while (length)
        })
        client.on('error', e => {
            error('client error ' + e)
            if (client)
                setTimeout(connectTcp, 500)
        })
        client.on('close', ()  => {
            log('client close')
        })
    }

    // create http server to return jpeg
    const createHttp = () => {
        app.get('/', (req, res) => {
            res.type('image/jpeg')
            res.send(jpeg)
        })
        server = http.createServer(app).listen(port, '0.0.0.0')
        log('Listening on port ' + port)
    }

    // public destroy
    this.destroy = () => {
        log('Pipeline destroy')
        if (server)
            server.close()
        if (client) {
            client.destroy()
            client = null
        }
        if (gst)
            gst.kill()
    }

    // public port
    this.port = port

    spawnPipeline(() => {
        connectTcp()
        createHttp()
    })
}
