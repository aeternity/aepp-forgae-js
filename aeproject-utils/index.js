const loggerUtils = require('./utils/logger-utils');
const printReportTable = loggerUtils.printReportTable;
const getReadableStatus = loggerUtils.getReadableStatus;

const fsUtils = require('./utils/fs-utils');
const print = fsUtils.print;
const printError = fsUtils.printError;
const createMissingFolder = fsUtils.createMissingFolder;
const copyFileOrDir = fsUtils.copyFileOrDir;
const getFiles = fsUtils.getFiles;
const readFileRelative = fsUtils.readFileRelative;
const writeFileRelative = fsUtils.writeFileRelative;
const fileExists = fsUtils.fileExists;
const readFile = fsUtils.readFile;
const deleteCreatedFiles = fsUtils.deleteCreatedFiles;
const createDirIfNotExists = fsUtils.createDirIfNotExists;
const writeFileSync = fsUtils.writeFile;

const aeprojectUtils = require('./utils/aeproject-utils');
const getClient = aeprojectUtils.getClient;
const getNetwork = aeprojectUtils.getNetwork;
const getCompiler = aeprojectUtils.getCompiler;
const sleep = aeprojectUtils.sleep;
const execute = aeprojectUtils.execute;
const aeprojectExecute = aeprojectUtils.aeprojectExecute;
const config = aeprojectUtils.config;
const handleApiError = aeprojectUtils.handleApiError;
const logApiError = aeprojectUtils.logApiError;
const timeout = aeprojectUtils.timeout;
const contractCompile = aeprojectUtils.contractCompile;
const checkNestedProperty = aeprojectUtils.checkNestedProperty;
const winExec = aeprojectUtils.winExec;
const readSpawnOutput = aeprojectUtils.readSpawnOutput;
const readErrorSpawnOutput = aeprojectUtils.readErrorSpawnOutput;
const capitalize = aeprojectUtils.capitalize;
const addCaretToDependencyVersion = aeprojectUtils.addCaretToDependencyVersion;
const prompt = aeprojectUtils.prompt;

const contract_utils = require('./utils/contract-utils');
const getFilesystem = contract_utils.getFilesystem;
const getContractContent = contract_utils.getContractContent;

const SophiaUtil = require('./utils/sophia-util');
const httpGet = require('./utils/http-utils').httpGet;

module.exports = {
    printReportTable,
    getReadableStatus,
    print,
    printError,
    createMissingFolder,
    copyFileOrDir,
    getFiles,
    getClient,
    getNetwork,
    getCompiler,
    sleep,
    execute,
    readFile,
    deleteCreatedFiles,
    config,
    handleApiError,
    logApiError,
    timeout,
    aeprojectExecute,
    readFileRelative,
    writeFileRelative,
    fileExists,
    SophiaUtil,
    contractCompile,
    checkNestedProperty,
    createDirIfNotExists,
    writeFileSync,
    winExec,
    httpGet,
    readSpawnOutput,
    readErrorSpawnOutput,
    capitalize,
    addCaretToDependencyVersion,
    prompt,
    getFilesystem,
    getContractContent
}
