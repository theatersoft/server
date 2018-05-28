import {log, error} from '@theatersoft/bus'
import {THEATERSOFT_CONFIG_HOME} from './config'

export function createServer ({app, port, domain, email}) {
    const
        store = require('le-store-certbot').create({
            configDir: `${THEATERSOFT_CONFIG_HOME}/acme/etc`,
            webrootPath: `/tmp/acme-challenges/`
        }),
        challenge = require('le-challenge-fs').create({
            webrootPath: `/tmp/acme-challenges/`
        }),
        approveDomains = (options, certs, cb) => {
            // This is where you check your database and associated
            // email addresses with domains and agreements and such

            // Opt-in to submit stats and get important updates
            options.communityMember = false

            // If you wish to replace the default challenge plugin, you may do so here
            options.challenges = {'http-01': challenge}

            // The domains being approved for the first time are listed in opts.domains
            // Certs being renewed are listed in certs.altnames
            if (certs)
                options.domains = certs.altnames
            else
                Object.assign(options, {email, agreeTos: true, domains: [domain]})

            cb(null, {options, certs})
        },
        greenlock = require('greenlock').create({
            version: 'draft-11',
            server: 'https://acme-v02.api.letsencrypt.org/directory',
            //server: 'https://acme-staging-v02.api.letsencrypt.org/directory',
            approveDomains,
            store
        })

    // handles acme-challenge and redirects to https
    require('http').createServer(greenlock.middleware(require('redirect-https')()))
        .listen(80, function () {
            log("Listening for ACME http-01 challenges on", this.address())
        })

    return require('https').createServer(greenlock.tlsOptions, greenlock.middleware(app))
        .listen(port, function () {
            log("Listening for ACME tls-sni-01 challenges and serve app on", this.address())
        })
}
