'use strict'
require('shelljs/make')

const
    pkg = require('./package.json'),
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
    node (name, dir) {
        console.log('target node')
        exec('mkdir -p dist')
        rollup.rollup({
                entry: `${dir}/index.js`,
                external: [
                    'util',
                    'fs',
                    ...Object.keys(pkg.dependencies)
                ],
                plugins: [
                    babel,
                    nodeResolve
                ]
            })
            .then(bundle => bundle.write({
                dest: `dist/${name}.js`,
                format: 'cjs',
                moduleName: name,
                banner: copyright,
                sourceMap: DIST ? false : 'inline'
            }))
            .then(() => console.log(`wrote dist/${name}.js`))
    },

    package () {
        const p = Object.entries(pkg).reduce((o, [k, v]) => {
            if (!['private', 'devDependencies', 'scripts'].includes(k)) {
                if ('distScripts' === k) k = 'scripts'
                o[k] = v
            }
            return o
        }, {})
        fs.writeFileSync('dist/package.json', JSON.stringify(p, null, '  '), 'utf-8')
        exec('sed -i "s|dist/||g" dist/package.json ')
        exec('cp LICENSE README.md src/capture/capture-server.js dist')
    },

    publish () {
        console.log('target publish')
        exec('npm publish --access=public dist')
    },

    async all () {
        await targets.node('server', 'src')
        await targets.node('capture', 'src/capture')
        targets.package()
    }
}

Object.assign(target, targets)