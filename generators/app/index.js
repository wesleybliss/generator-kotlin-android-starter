'use strict'
const fs = require('fs')
const path = require('path')
const Generator = require('yeoman-generator')
const chalk = require('chalk')
const yosay = require('yosay')

const generatorName = 'Kotlin Android Starter'
const generatorTitle = chalk.red(generatorName)
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
        
        this.fs.copy(
            this.templatePath('dummyfile.txt'),
            this.destinationPath('dummyfile.txt')
        )
        
    }
    
    install() {
        this.installDependencies()
    }
    
}
