'use strict'
const
    url = require('url'),
    bus = process.env.BUS || 'ws://localhost:5453',
    {protocol, host} = url.parse(bus),
    uri = `http${protocol === 'wss:' ? 's' : ''}://${host}/theatersoft/rpc`,
    FileCookieStore = require('tough-cookie-filestore'),
    jar = require('request').jar(new FileCookieStore('.cookies.json')),
    request = require('request').defaults({
        uri,
        method: 'POST',
        jar,
        rejectUnauthorized: false
    }),
    log = (...args) =>
        console.log(...args)

//process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0' // DEPTH_ZERO_SELF_SIGNED_CERT

const rpc = (method, args = []) => {
    return new Promise((r, j) => {
        request({
            body: JSON.stringify({method, args})
        }, (error, response, body) => {
            if (error)
                j(error)
            else if (response.statusCode === 200) {
                try {
                    r(JSON.parse(body).result)
                } catch (e) {
                    j(e)
                }
            }
            else
                j(response.statusMessage)
        })
    })
}

module.exports = {rpc, request, jar}

