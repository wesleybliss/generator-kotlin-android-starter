
export const generatorTitle =
    chalk.yellow('Kot') +
    chalk.blue('lin') + ' ' +
    chalk.green('Android') + ' ' +
    chalk.white('Starter')

export const promptsDir = path.resolve(__dirname, 'prompts')
export const repoUrl = 'https://github.com/wesleybliss/kotlin-android-starter.git'
export const demoPackage = 'com.kotlinandroidstarter.app'

// Mutable, in case project subdir needs to be appended
// so we don't accidentally nuke the path they're in
export const projectRoot = process.cwd()

export const cloneOpts = {
    shallow: true,
    checkout: 'master'
}

/*
Variables within the Android source code that can be replaced
E.g. in Android source:
apply plugin: 'com.android.application'
//VAR:FABRIC apply plugin: 'io.fabric'
*/
export const VARS = {
    FABRIC: 'FABRIC'
}
