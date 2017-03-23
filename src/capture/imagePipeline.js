//gst-launch v4l2src device=/dev/video0 norm=NTSC ! videorate ! video/x-raw-yuv,framerate=4/1 ! jpegenc ! multipartmux ! tcpserversink port=5400
//gst-launch tcpclientsrc port=5400 ! multipartdemux ! jpegdec ! xvimagesink
import {log, error} from '@theatersoft/bus'

var
    express = require('express'),
    http = require('http'),
    net = require('net'),
    child = require('child_process')

function Pipeline (device) {
    var
        app = express(),
        port = 5400 + Number(device),
        tcpPort = port - 100,
        gst,
        client,
        server,
        remaining, // if nonzero, length remaining of incompete buffer
        buffer, // incomplete buffer
        jpeg = null // current complete buffer

    // spawn gstreamer pipeline to send jpeg stream
    var spawnPipeline = function (cb) {
        var pipeline = 'v4l2src device=/dev/cctv'
            + device
            + ' norm=NTSC !'
            + ' video/x-raw,format=YUY2,width=640,height=480,framerate=30000/1001 !'
            + ' deinterlace method=2 !'
            + ' videorate ! video/x-raw,framerate=4/1 ! jpegenc ! multipartmux ! tcpserversink port='
            + tcpPort

        var env = process.env
//        if (device == '3')
//            env.GST_DEBUG = 3
        log('pipeline:', pipeline)

        gst = child.spawn('gst-launch-1.0', pipeline.split(' '), {stdio: 'inherit', env: env})
        gst.on('exit', function (code) {
            log('pipeline exit ' + code)
        })

        // how to wait for child init complete?
        setTimeout(cb, 1000)
    }

    // connect tcpclient to receive jpeg stream
    var connectTcp = function () {
        client = net.connect(tcpPort, function () {
            log('client connect')
        })
        client.on('data', function (data) {
            var length = data.length, head, lines
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
        client.on('error', function (error) {
            error('client error ' + error)
            if (client)
                setTimeout(connectTcp, 500)
        })
        client.on('close', function (had_error) {
            log('client close')
        })
    }

    // create http server to return jpeg
    var createHttp = function () {
        app.get('/', function (req, res) {
            res.type('image/jpeg')
            res.send(jpeg)
        })
        server = http.createServer(app).listen(port)
        log('Listening on port ' + port)
    }

    // public destroy
    this.destroy = function () {
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

    spawnPipeline(function () {
        connectTcp()
        createHttp()
    })
}

export default {
    create (device) {
        return new Pipeline(device)
    }
}
