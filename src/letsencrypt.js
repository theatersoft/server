import {log, error} from '@theatersoft/bus'
import {THEATERSOFT_CONFIG_HOME} from './config'

const
    LE = require('greenlock'),
    store = require('le-store-certbot').create({
        configDir: `${THEATERSOFT_CONFIG_HOME}/letsencrypt/etc`,
        debug: false
    }),
    challenge = require('le-challenge-fs').create({
        webrootPath: `${THEATERSOFT_CONFIG_HOME}/letsencrypt/var/`,
        debug: false
    })

let le
export function createServer ({app, domain, email, production}) {
    function approveDomains (options, certs, cb) {
        // The domains being approved for the first time are listed in opts.domains
        // Certs being renewed are listed in certs.altnames
//debugger
        if (certs)
            options.domains = certs.altnames
        else
            Object.assign(options, {email, agreeTos: true, domain, domains: [domain]})

        cb(null, {options, certs})
    }

    le = LE.create({
        app,
        approveDomains,
        email,
        server: production ? LE.productionServerUrl : LE.stagingServerUrl,
        store,                                                           // handles saving of config, accounts, and certificates
        challenges: {'http-01': challenge},                  // handles /.well-known/acme-challege keys and tokens
        challengeType: 'http-01',                               // default to this challenge type
        agreeTos: true,
        // sni: require('le-sni-auto').create({}),                // handles sni callback
        debug: false
        //log
    })

    // handles acme-challenge and redirects to https
    require('http').createServer(le.middleware(require('redirect-https')()))
        .listen(80, function () {
            log("Listening for ACME http-01 challenges on", this.address())
        })

    // handles your app
    return require('https').createServer(le.httpsOptions, le.middleware(app))
        .listen(443, function () {
            log("Listening for ACME tls-sni-01 challenges and serve app on", this.address())
        })
}
