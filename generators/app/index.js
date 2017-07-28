'use strict'
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')
const Generator = require('yeoman-generator')
const chalk = require('chalk')
const yosay = require('yosay')

const generatorTitle =
    chalk.yellow('Kot') +
    chalk.blue('lin') + ' ' +
    chalk.green('Android') + ' ' +
    chalk.white('Starter')

const promptsDir = path.resolve(__dirname, 'prompts')


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
        
        this.log(JSON.stringify(this.props, null, '    '))
        
        const namespace = this.props.appNamespace.replace(/\./g, '/')
        
        this.log(JSON.stringify({
            namespace,
            sourceRoot: this.sourceRoot()
        }, null, '    '))
        
        mkdirp('app/src')
        mkdirp('app/src/test')
        mkdirp('app/src/androidTest')
        mkdirp(`app/src/main/kotlin/${namespace}`)
        
        /*this.fs.copy(
            this.templatePath('dummyfile.txt'),
            this.destinationPath('dummyfile.txt')
        )*/
        
    }
    
    install() {
        
        //this.installDependencies()
        
    }
    
}
