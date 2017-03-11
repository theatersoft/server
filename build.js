'use strict'
require('shelljs/make')

const
    pkg = require('./package.json'),
    name = pkg.name.startsWith('@theatersoft') && pkg.name.slice(13),
    DIST = process.env.DIST === 'true',
    path = require('path'),
    fs = require('fs'),
    copyright = `/*\n${fs.readFileSync('COPYRIGHT', 'utf8')}\n */`,
    rollup = require('rollup'),
    babel = require('rollup-plugin-babel')({
        babelrc: false,
        comments: !DIST,
        minified: DIST,
        //presets: [babili],
        plugins: [
            //require("babel-plugin-transform-class-properties"),
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
    async node (src, dst) {
        console.log('target node')
        exec('mkdir -p dist')
        await (await rollup.rollup({
                entry: `${src}/index.js`,
                external: [
                    'util',
                    'fs',
                    ...Object.keys(pkg.dependencies)
                ],
                plugins: [
                    babel,
                    nodeResolve
                ]
            }))
            .write({
                dest: `dist/${dst}.js`,
                format: 'cjs',
                moduleName: path.basename(dst),
                banner: copyright,
                sourceMap: DIST ? false : 'inline'
            })
        console.log(`wrote dist/${dst}.js`)
    },

    package () {
        const p = Object.assign({}, pkg, {
            private: !DIST,
            devDependencies: undefined,
            distScripts: undefined,
            scripts: pkg.distScripts
        })
        fs.writeFileSync('dist/package.json', JSON.stringify(p, null, '  '), 'utf-8')
        exec('sed -i "s|dist/||g" dist/package.json ')
        exec('cp LICENSE README.md dist')
        exec('cp src/capture/start.js dist/capture')
        exec('cd dist; npm pack')
    },

    publish () {
        console.log('target publish')
        exec('npm publish --access=public dist')
    },

    async all () {
        await targets.node('src', 'server')
        await targets.node('src/capture', 'capture/capture')
        targets.package()
    }
}

Object.assign(target, targets)