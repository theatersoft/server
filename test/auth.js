'use strict'
const
    fs = require('fs'),
    url = require('url'),
    bus = process.env.BUS || 'ws://localhost:5453',
    {protocol, host} = url.parse(bus),
    uri = `http${protocol === 'wss:' ? 's' : ''}://${host}/`,
    {rpc, jar} = require('./rpc')

const
    cookies = jar.getCookies(uri)

//console.log(cookies)

const
    cookie = cookies.find(c => c.key === 'sid'),
    sid = cookie ? cookie.value : ''

console.log('auth', sid)
fs.writeFileSync('.auth', sid)
