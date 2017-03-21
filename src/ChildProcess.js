import {log} from '@theatersoft/bus'
var
    config = require('./Config'),
    spawn = require('child_process').spawn,
    cmds = {},
    makeCommand = function (name, cmd) {
        var
            child,
            started
        return {
            start: function () {
                log('start child', name)
                started = true
                var env = process.env
                child = spawn(cmd.command, cmd.args || [], {stdio: 'inherit', env: env})
                child.on('error', function (err) {
                    log(name, 'child err', err)
                    started = false
                })
                child.on('close', function (code, signal) {
                    log(name, 'child closed', code, signal)
                    started = false
                })
            },
            stop: function () {
                if (child) {
                    log('stop child', name)
                    child.kill('SIGTERM')
                }
            },
            get: function () {
                return {started: started}
            }
        }
    }

//if (config.host.ChildProcess)
//    for (name in config.host.ChildProcess) {
//        cmd = config.host.ChildProcess[name]
//        cmds[name] = makeCommand(name, cmd)
//    }

module.exports = config.ChildProcess = cmds