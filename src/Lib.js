var
    request = require('request'),
    port = '5453',
    //port = '8478',
    prefix = '/theatersoft',
    tsUrl = 'https://rhuehn.homeip.net' + ':' + port + prefix,
    jar = request.jar()

module.exports = {
    rpc: function (method, args, cb) {
        request({
            url: tsUrl + '/rpc',
            method: "POST",
            json: {
                method: method,
                args: args || []
            },
            jar: jar,
            rejectUnauthorized: false
        }, function (error, response, body) {
            var result
            if (!error){
                result = body.result
                error = body.error
            }
            console.log(result, error, jar)
            cb && cb(result, error)
        })
    }
}
