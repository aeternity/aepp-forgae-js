/*
 * ISC License (ISC)
 * Copyright (c) 2018 aeternity developers
 *
 *  Permission to use, copy, modify, and/or distribute this software for any
 *  purpose with or without fee is hereby granted, provided that the above
 *  copyright notice and this permission notice appear in all copies.
 *
 *  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
 *  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
 *  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
 *  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
 *  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
 *  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
 *  PERFORMANCE OF THIS SOFTWARE.
 */
require = require('esm')(module /*, options */) // use to handle es6 import/export

const {
    print,
    printError,
    readSpawnOutput
} = require('aeproject-utils')

const nodeConfig = require('aeproject-config')
const nodeConfiguration = nodeConfig.nodeConfiguration;
const compilerConfiguration = nodeConfig.compilerConfiguration;

const EnvService = require('../EnvService')

class Env extends EnvService {
    
    constructor () {
        super('')
    }
    async printInfo (running) {
        
        if (!running) {
            printError(`===== Compiler or Node is not running! ===== \n===== Please run the relevant command for your image! =====`)
            return
        }

        let buff = await this.getInfo();
        let res = readSpawnOutput(buff)

        print(res);
    }

    async areNodeAndCompilerRunning (...images) {
        let running = true

        for (const currImage in images) {
            running = await super.waitForContainer(images[currImage]) && running
        }

        return running
    }

    async run (option) {
        let running;
        let dockerImage = option.windows ? nodeConfiguration.dockerImage : nodeConfiguration.dockerServiceNodeName;
        let compilerImage = option.windows ? compilerConfiguration.dockerImage : compilerConfiguration.dockerServiceCompilerName;
        
        running = await this.areNodeAndCompilerRunning(dockerImage, compilerImage)

        if (option.info) {
            await this.printInfo(running)
            return
        }

        if (option.stop) {

            // if not running, current env may be windows
            // to reduce optional params we check is it running on windows env
            if (!running) {
                running = await this.areNodeAndCompilerRunning(dockerImage, compilerImage)
                printError(`===== Compiler or Node is not running! ===== \n===== Please run the relevant command for your image! =====`)
                return
            }

            if (!running) {
                return
            }

            super.printInitialStopMsg()

            try {
                await super.stopAll();
            } catch (error) {
                printError(Buffer.from(error.stderr).toString('utf-8'))
            }

            return;
        }
        
        if (!await super.shouldProcessStart(running)) return

        try {
            super.printStarMsg()
            
            let startingNodeSpawn = super.start();

            await super.toggleLoader(startingNodeSpawn, dockerImage)

            super.printSuccessMsg()

            if (option.windows) {
                let dockerIp = super.removePrefixFromIp(option.dockerIp);
                await super.fundWallets(dockerIp);
            } else {
                await super.fundWallets();
            }

            print('\r\n===== Default wallets were successfully funded! =====');
        } catch (e) {
            printError(e.message || e);
        }
    }
}

const env = new Env()

module.exports = {
    run: async (options) => {
        await env.run(options)
    }
}