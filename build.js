'use strict'
require('shelljs/make')
process.on('unhandledRejection', e => console.log(e))

const
    pkg = require('./package.json'),
    name = pkg.name.startsWith('@theatersoft') && pkg.name.slice(13),
    DIST = process.env.DIST === 'true',
    path = require('path'),
    fs = require('fs'),
    writeJson = (file, json) => fs.writeFileSync(file, JSON.stringify(json, null, '  '), 'utf-8'),
    copyright = `/*\n${fs.readFileSync('COPYRIGHT', 'utf8')}\n */`,
    rollup = require('rollup'),
    babel = require('rollup-plugin-babel')({
        babelrc: false,
        comments: !DIST,
        minified: DIST,
        //presets: [babili],
        plugins: [
            require("babel-plugin-transform-class-properties"),
            [require("babel-plugin-transform-object-rest-spread"), {useBuiltIns: true}]
        ].concat(DIST ? [
            require("babel-plugin-minify-constant-folding"),
            //require("babel-plugin-minify-dead-code-elimination"), // FAIL NodePath has been removed so is read-only
            require("babel-plugin-minify-flip-comparisons"),
            require("babel-plugin-minify-guarded-expressions"),
            require("babel-plugin-minify-infinity"),
            require("babel-plugin-minify-mangle-names"),
            require("babel-plugin-minify-replace"),
            //FAIL require("babel-plugin-minify-simplify"),
            require("babel-plugin-minify-type-constructors"),
            require("babel-plugin-transform-member-expression-literals"),
            require("babel-plugin-transform-merge-sibling-variables"),
            require("babel-plugin-transform-minify-booleans"),
            require("babel-plugin-transform-property-literals"),
            require("babel-plugin-transform-simplify-comparison-operators"),
            require("babel-plugin-transform-undefined-to-void")
        ] : [])
    }),
    nodeResolve = require('rollup-plugin-node-resolve')({jsnext: true})

const targets = {
    async node (src, dst, format = 'cjs') {
        console.log('target node')
        exec('mkdir -p dist')
        const
            es = format === 'es' ? '.es' : '',
            dest = `dist/${dst}${es}.js`
        await (await rollup.rollup({
                entry: `${src}/index.js`,
                external: [
                    'util', 'fs', 'path', 'http', 'net', 'child_process', 'url', 'os',
                    ...Object.keys(pkg.dist.dependencies)
                ],
                plugins: [
                    babel,
                    nodeResolve
                ]
            }))
            .write({
                dest,
                format,
                moduleName: path.basename(dst),
                banner: copyright,
                sourceMap: DIST ? false : 'inline'
            })
        console.log(`wrote ${dest}`)
    },

    package () {
        writeJson('dist/package.json', Object.assign({}, pkg, {private: !DIST, dist: undefined}, pkg.dist))
        exec('cp LICENSE README.md .npmignore src/start.js dist')
        exec('cp src/capture/start.js dist/capture')
    },

    publish () {
        console.log('target publish')
        exec('npm publish --access=public dist')
    },

    async watch () {
        await targets.all()
        require('chokidar').watch([
                'src'
            ])
            .on('change', path => {
                console.log(new Date().toLocaleTimeString(), path)
                targets.all()
            })
            .on('error', e => console.log(e))
    },

    async all () {
        await targets.node('src', 'index')
        await targets.node('src/lib', 'lib')
        await targets.node('src/capture', 'capture/index')
        targets.package()
    }
}

Object.assign(target, targets)