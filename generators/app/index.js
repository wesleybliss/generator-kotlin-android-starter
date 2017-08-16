'use strict'

/****************************************************************
 *
 * TODO
 *     - cleanup & clarity - promises are a bit of a mess
 *     
 ****************************************************************/

const promisify = require('./promisify')
const fs = require('fs')
const path = require('path')
const rimraf = promisify(require('rimraf'))
const mv = promisify(require('mv'))
const mkdirp = promisify(require('mkdirp'))
const clone = promisify(require('git-clone'))
const ncp = promisify(require('ncp').ncp)
const replace = require('replace')
const spawn = require('child_process').spawn
const chalk = require('chalk')
const Generator = require('yeoman-generator')
const yosay = require('yosay')

const generatorTitle =
    chalk.yellow('Kot') +
    chalk.blue('lin') + ' ' +
    chalk.green('Android') + ' ' +
    chalk.white('Starter')

const promptsDir = path.resolve(__dirname, 'prompts')
const repoUrl = 'https://github.com/wesleybliss/kotlin-android-starter.git'
const demoPackage = 'com.kotlinandroidstarter.app'

// Mutable, in case project subdir needs to be appended
// so we don't accidentally nuke the path they're in
let projectRoot = process.cwd()

const cloneOpts = {
    shallow: true,
    checkout: 'master'
}


/**
 * Synchronously Replace necessary strings in files.
 * 
 * @param {String} namespace Application namespace, specified by the user (e.g. com.foo.bar)
 */
const replaceAndRename = namespace => {
    
    replace({
        regex: demoPackage,
        replacement: namespace.replace(/\//g, '.'),
        paths: [projectRoot],
        recursive: true,
        silent: true
    })
    
    const pr = dir => path.resolve(projectRoot, dir)
    const demoNs = demoPackage.replace(/\./g, '/')
    
    if (demoNs != namespace) {
        
        const demoSource = pr(`app/src/main/kotlin/${demoNs}`)
        const demoTestSource = pr(`app/src/test/kotlin/${demoNs}`)
        const demoAndroidTestSource = pr(`app/src/androidTest/kotlin/${demoNs}`)
        
        const projectSource = pr(`app/src/main/kotlin/${namespace}/`)
        
        // app
        const appSrcTemp = path.join(projectRoot, 'app-source-temp')
        const targetNs = path.resolve(pr('app/src/main/kotlin'), namespace)
        
        // test
        const testSrcTemp = path.join(projectRoot, 'test-source-temp')
        const targetTestNs = path.resolve(pr('app/src/test/kotlin'), namespace)
        
        // androidTest
        const androidTestSrcTemp = path.join(projectRoot, 'android-test-source-temp')
        const targetAndroidTestNs = path.resolve(pr('app/src/androidTest/kotlin'), namespace)
        
        /*
        - move the actual src files to the top level temporarily
        - remove the demo package entirely (it's empty now anyway)
        - create the new, user-specified package
        - move the actual src files into the new package
        */
        return mv(demoSource, appSrcTemp)
            .then(() => rimraf(
                path.resolve(
                    pr('app/src/main/kotlin'),
                    demoNs.split('/').shift()
                )
            ))
            .then(() => mkdirp(targetNs))
            .then(() => mv(appSrcTemp, `${targetNs}/`))
            /* Now do the same with test */
            .then(() => mv(demoTestSource, testSrcTemp))
            .then(() => rimraf(
                path.resolve(
                    pr('app/src/test/kotlin'),
                    demoNs.split('/').shift()
                )
            ))
            .then(() => mkdirp(targetTestNs))
            .then(() => mv(testSrcTemp, `${targetTestNs}/`))
            /* Now do the same with androidTest */
            .then(() => mv(demoAndroidTestSource, androidTestSrcTemp))
            .then(() => rimraf(
                path.resolve(
                    pr('app/src/androidTest/kotlin'),
                    demoNs.split('/').shift()
                )
            ))
            .then(() => mkdirp(targetAndroidTestNs))
            .then(() => mv(androidTestSrcTemp, `${targetAndroidTestNs}/`))
            .then(() => new Promise((resolve, reject) => {
                let readme = path.resolve(projectRoot, 'README.md')
                fs.writeFile(readme, '> ' + namespace.replace(/\//g, '.'), err => {
                    if (err) reject(err)
                    else resolve()
                })
            }))
        
    }
    
    return Promise.resolve()
    
}

const initProject = generator => {
    
    const namespace = generator.props.appNamespace.replace(/\./g, '/')
    
    generator.log(JSON.stringify({
        namespace,
        sourceRoot: generator.sourceRoot()
    }, null, '    '))
    
    const childLog = (data, error) => {
        if (data && data.toString().trim().length > 0) {
            data = data.toString()
            console.log(error ? chalk.red(data) : data)
        }
    }
    
    /////////////////////////////////////////////////////////
    // IMPORTANT: Don't delete stuff in the projectRoot if //
    // the CWD is not in the subdirectory of the project!  //
    /////////////////////////////////////////////////////////
    if (!projectRoot.endsWith(generator.props.appName))
        projectRoot = path.join(projectRoot, generator.props.appName)
    
    return mkdirp(projectRoot)
        .then(() => Promise.resolve(fs.readdirSync(projectRoot)))
        .then(files => {
            return Promise.all(files.map(
                f => rimraf(path.resolve(projectRoot, f))))
        })
        .then(() => ncp(generator.sourceRoot(), projectRoot))
        .then(() => {
            try { rimraf(path.resolve(projectRoot, '.git')) }
            catch (e) {}
        })
        .then(() => replaceAndRename(namespace))
        .then(() => new Promise((resolve, reject) => {
            if (generator.props.runGradle) {
                let child = spawn(
                    path.resolve(projectRoot, 'gradlew'),
                    ['assembleDebug'], { cwd: projectRoot }
                )
                child.stdout.on('data', data => { childLog(data) })
                child.stderr.on('data', data => { childLog(data, true) })
                child.on('close', code => {
                    console.log('finished with code: ' + code)
                    if (code && parseInt(code) === 0) resolve()
                    else reject(code)
                })
            }
            else {
                resolve()
            }
                        
        }))
        .catch(err => console.error(err))
    
}


module.exports = class extends Generator {
    
    prompting() {
        
        this.log(yosay(`Behold, ${generatorTitle}!`))
        
        const prompts = fs.readdirSync(promptsDir)
            .filter(x => x.endsWith('.js'))
            .map(x => require(path.resolve(promptsDir, x)))
        
        return this.prompt(prompts).then(props => {
            // To access props later use this.props.someAnswer;
            this.props = props
        })
        
    }
    
    writing() {
        
        // Note: these need to be written with ()=> empty methods or they run too fast
        if (!this.props.updateRepo) {
            initProject(this)
        }
        else {
            rimraf(this.sourceRoot())
                .then(() => mkdirp(this.sourceRoot()))
                .then(() => clone(repoUrl, this.sourceRoot(), cloneOpts))
                .then(() => initProject(this))
        }
        
    }
    
    install() {
        
        //this.installDependencies()
        
    }
    
}
