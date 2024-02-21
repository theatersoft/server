process.on('unhandledRejection', e => console.log(e))
const
    fs = require('fs'),
    THEATERSOFT_CONFIG_HOME = `${process.env.XDG_CONFIG_HOME || `${process.env.HOME}/.config`}/theatersoft`,
    config = require(`${THEATERSOFT_CONFIG_HOME}/config.json`),
    { domain, email, staging } = config.letsencrypt,
    package = require('./package.json'),
    Greenlock = require('@root/greenlock'),
    createOptions = {
        packageRoot: __dirname,
        configDir: `${THEATERSOFT_CONFIG_HOME}/greenlock.d/config.json`,
        staging,
        maintainerEmail: email,
        packageAgent: `${package.name}/${package.version}`
    }
const gl = Greenlock.create(createOptions)
gl.add({
    subject: domain,
    altnames: [domain]
})
console.log('done')   