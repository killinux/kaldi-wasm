import JSZip from 'jszip';

import kaldiJS from '../computations/kaldiJS';
import kaldiWasm from '../computations/kaldiJS.wasm';
import KaldiConfigParser from '../utils/kaldiConfigParser';

const kaldiModule = kaldiJS({
  locateFile(path) {
    if (path.endsWith('.wasm')) return kaldiWasm;
    return path;
  },
});

const MODEL_STORE = {
  NAME: 'models',
  KEY_PATH: 'language',
};

let asr = null;
let parser = null;

function mkdirExistOK(fileSystem, path) {
  try {
    fileSystem.mkdir(path);
  } catch (e) {
    if (e.code !== 'EEXIST') throw e;
  }
}

function initEMFS(fileSystem, modelName) {
  mkdirExistOK(fileSystem, MODEL_STORE.NAME);
  fileSystem.mount(fileSystem.filesystems.IDBFS, {},
    MODEL_STORE.NAME);
  fileSystem.chdir(MODEL_STORE.NAME);
  fileSystem.mkdir(modelName);
  fileSystem.chdir(modelName);
}

async function unzip(zipfile) {
  const zip = new JSZip();

  const unzipped = await zip.loadAsync(zipfile);
  return unzipped;
}

function dirname(path) {
  const dirs = path.match(/.*\//);
  if (dirs === null) return '';
  // without trailing '/'
  return dirs[0].slice(0, dirs[0].length - 1);
}

function mkdirp(fileSystem, path) {
  const dirBoundary = '/';
  const startIndex = path[0] === dirBoundary ? 1 : 0;
  for (let i = startIndex; i < path.length; i += 1) {
    if (path[i] === dirBoundary) mkdirExistOK(fileSystem, path.slice(0, i));
  }
  mkdirExistOK(fileSystem, path);
}

async function writeToFileSystem(fileSystem, path, fileObj) {
  const content = await fileObj.async('arraybuffer');
  try {
    fileSystem.writeFile(path, new Uint8Array(content));
    return;
  } catch (e) {
    if (e.code === 'ENOENT') {
      const dirName = dirname(path);
      mkdirp(fileSystem, dirName);
      // eslint-disable-next-line consistent-return
      return writeToFileSystem(fileSystem, path, fileObj);
    }
    throw e;
  }
}
//-----add by hao for globle Promise.then return to thisModule  ---begin
var thisModule;
//-----add by hao for globle Promise.then return to thisModule  ---end
async function loadToFS(modelName, zip) {
//-----add by hao for kaldiJS.then   ---begin
  await  kaldiModule.then(
	  function(result){
	       thisModule=result;
	       initEMFS(thisModule.FS, modelName);
	  }
  );
//-----add by hao for globle Promise.then return  ---end
//  initEMFS(kaldiModule.FS, modelName);
  const unzipped = await unzip(zip);

  // hack to wait for model saving on Emscripten fileSystem
  // unzipped.forEach does not allow to wait for end of async calls
  const files = Object.keys(unzipped.files);
  await Promise.all(files.map(async (file) => {
    const content = unzipped.file(file);
    if (content !== null) {
 //     await writeToFileSystem(kaldiModule.FS, content.name, content);
		await writeToFileSystem(thisModule.FS, content.name, content);
    }
  }));
  return true;
}

/*
 * Assumes that we are in the directory with the requested model
 */
//function startASR() {
//  parser = new KaldiConfigParser(kaldiModule.FS, kaldiModule.FS.cwd());
//  const args = parser.createArgs();
//  const cppArgs = args.reduce((wasmArgs, arg) => {
//    wasmArgs.push_back(arg);
//    return wasmArgs;
//  }, new kaldiModule.StringList());
//  return new kaldiModule.OnlineASR(cppArgs);
//}
//-----modify  by hao for startASR,change kaldiModule to Promise.then globle thisModule
function startASR() {
  parser = new KaldiConfigParser(thisModule.FS, thisModule.FS.cwd());
  const args = parser.createArgs();
  const cppArgs = args.reduce((wasmArgs, arg) => {
    wasmArgs.push_back(arg);
    return wasmArgs;
  }, new thisModule.StringList());
  return new thisModule.OnlineASR(cppArgs);
}

const helper = {
  async init(msg) {
    await loadToFS(msg.data.modelName, msg.data.zip);
    asr = startASR();
  },
  async process(msg) {
    if (asr === null) throw new Error('ASR not ready');
    const asrOutput = asr.processBuffer(msg.data.pcm);
    if (asrOutput === '') return null;
    return {
      isFinal: asrOutput.endsWith('\n'),
      text: asrOutput.trim(),
    };
  },
  async samplerate() {
    if (parser === null) throw new Error('ASR not ready');
    return parser.getSampleRate();
  },
  async reset() {
    if (asr === null) throw new Error('ASR not ready');
    const asrOutput = asr.reset();
    const result = {
      isFinal: asrOutput.endsWith('\n'),
      text: asrOutput.trim(),
    };
    return result;
  },
  async terminate() {
    if (asr !== null) asr.delete();
    asr = null;
  },
};

onmessage = (msg) => {
  const { command } = msg.data;
  const response = { command, ok: true };

  if (command in helper) {
    helper[command](msg)
      .then((value) => { response.value = value; })
      .catch((e) => {
        response.ok = false;
        response.value = e;
      })
      .finally(() => { postMessage(response); });
  } else {
    response.ok = false;
    response.value = new Error(`Unknown command '${command}'`);
    postMessage(response);
  }
};
