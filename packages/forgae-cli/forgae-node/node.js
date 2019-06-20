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
    printError,
    print
} = require('forgae-utils');
const utils = require('forgae-utils');
const {
    spawn
} = require('promisify-child-process');

const fs = require('fs');
const path = require('path');
const dockerCLI = require('docker-cli-js');
const docker = new dockerCLI.Docker();
const nodeConfig = require('forgae-config')
const config = nodeConfig.config;
const defaultWallets = nodeConfig.defaultWallets;
const localCompilerConfig = nodeConfig.localCompiler;
const dockerConfiguration = nodeConfig.dockerConfiguration;

let balanceOptions = {
    format: false
}
let network = utils.config.localhostParams
network.compilerUrl = utils.config.compilerUrl

const MAX_SECONDS_TO_RUN_NODE = 60;

async function waitForContainer (dockerImage) {
    let running = false

    await docker.command('ps', function (err, data) {
        if (err) {
            throw new Error(err);
        }

        data.containerList.forEach(function (container) {
            if (container.image.startsWith(dockerImage) && container.status.indexOf("healthy") != -1) {
                running = true;
            }
        })
    });
    return running;
}

async function fundWallets () {
    await waitToMineCoins()

    let walletIndex = 0;

    let client = await utils.getClient(network);
    await printBeneficiaryKey(client);
    for (let wallet in defaultWallets) {
        await fundWallet(client, defaultWallets[wallet].publicKey)
        await printWallet(client, defaultWallets[wallet], `#${ walletIndex++ }`)
    }
}

async function printBeneficiaryKey (client) {
    await printWallet(client, config.keyPair, "Miner")
}

async function printWallet (client, keyPair, label) {
    let keyPairBalance = await client.balance(keyPair.publicKey, balanceOptions)

    print(`${ label } ------------------------------------------------------------`)
    print(`public key: ${ keyPair.publicKey }`)
    print(`private key: ${ keyPair.secretKey }`)
    print(`Wallet's balance is ${ keyPairBalance }`);
}

async function waitToMineCoins () {
    let client = await utils.getClient(network);
    let heightOptions = {
        interval: 8000,
        attempts: 300
    }
    await client.awaitHeight(10, heightOptions)
}

async function fundWallet (client, recipient) {

    client.setKeypair(config.keyPair)
    await client.spend(config.amountToFund, recipient)

}

function hasNodeConfigFiles () {
    const neededConfigFile = nodeConfig.dockerConfiguration.configFileName;
    const configFilePath = path.resolve(process.cwd(), neededConfigFile);
    let isDockerConfigFileExists = fs.existsSync(configFilePath);

    if (!isDockerConfigFileExists) {
        console.log(`Missing ${ neededConfigFile } file!`);
        return false;
    }

    let fileContent = fs.readFileSync(configFilePath, 'utf-8');

    if (fileContent.indexOf(nodeConfig.dockerConfiguration.textToSearch) < 0) {
        console.log(`Invalid ${ neededConfigFile } file! Missing docker Ae node configuration.`);
        return false;
    }

    return true;
}

function stopLocalCompiler () {

    // get docker container ID - compiler
    let tempOutput = [];
    let dockerPs = spawn('docker', [
        'ps'
    ]);

    dockerPs.stdout.on('data', (data) => {
        tempOutput.push(data.toString());
    });

    setTimeout(function () {

        let containerId = '';
        tempOutput.forEach(x => {
            let rgx = /(?:\s+|\n)([a-zA-Z0-9]+)\s+(?=aeternity\/aesophia_http)/gm
            let match = rgx.exec(x);
            while (match) {
                if (match[1]) {
                    containerId = match[1]
                }

                match = rgx.exec(x);
            }
        })

        if (containerId) {
            spawn('docker', [
                'stop',
                containerId
            ]);

            print('===== Local Compiler was successfully stopped! =====');
        }
    }, 1000);
}

async function run (option) {

    try {
        let running = await waitForContainer(dockerConfiguration.dockerImage);

        if (option.stop) {
            if (!running) {
                print('===== Node is not running! =====');
                return
            }

            print('===== Stopping node =====');

            await spawn('docker-compose', ['down', '-v'], {});

            print('===== Node was successfully stopped! =====');

            stopLocalCompiler();

            return;
        }

        if (!hasNodeConfigFiles()) {
            console.log('Process will be terminated!');
            return;
        }

        if (running) {
            print('\r\n===== Node already started and healthy! =====');
            return;
        }

        print('===== Starting node =====');

        let startingNodeSpawn = spawn('docker-compose', ['up', '-d']);

        startingNodeSpawn.stdout.on('data', (data) => {
            print(data.toString());
        });

        let errorMessage = '';
        startingNodeSpawn.stderr.on('data', (data) => {
            errorMessage += data.toString();
            print(data.toString())
        });

        let counter = 0;
        while (!(await waitForContainer(dockerConfiguration.dockerImage))) {
            if (errorMessage.indexOf('port is already allocated') >= 0 || errorMessage.indexOf(`address already in use`) >= 0) {
                await spawn('docker-compose', ['down', '-v'], {});
                throw new Error(`Cannot start AE node, port is already allocated!`)
            }

            process.stdout.write(".");
            utils.sleep(1000);

            // prevent infinity loop
            counter++;
            if (counter >= MAX_SECONDS_TO_RUN_NODE) {
                throw new Error("Cannot start AE Node!")
            }
        }

        print('\n\r===== Node was successfully started! =====');

        if (!option.only) {

            try {
                await startLocalCompiler(option.compilerPort);

                print(`===== Local Compiler was successfully started on port:${ option.compilerPort }! =====`);

            } catch (error) {

                await spawn('docker-compose', ['down', '-v'], {});
                print('===== Node was successfully stopped! =====');

                const errorMessage = readErrorSpawnOutput(error);
                if (errorMessage.indexOf('port is already allocated') >= 0) {
                    const errorMessage = `Cannot start local compiler on port:${ option.compilerPort }, port is already allocated!`;
                    console.log(errorMessage);
                    throw new Error(errorMessage);
                }

                throw new Error(error);
            }
        }

        print('===== Funding default wallets! =====');

        await fundWallets();

        print('\r\n===== Default wallets was successfully funded! =====');
    } catch (e) {
        printError(e.message || e);
    }
}

function startLocalCompiler (port) {
    return spawn('docker', [
        'run',
        '-d',
        '-p',
        `${ port }:${ localCompilerConfig.port }`,
        `${ localCompilerConfig.dockerImage }:${ localCompilerConfig.imageVersion }`
    ]);
}

function readErrorSpawnOutput (spawnError) {
    const buffMessage = Buffer.from(spawnError.stderr);
    return buffMessage.toString('utf8');
}

module.exports = {
    run
}