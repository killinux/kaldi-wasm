/* eslint-disable no-restricted-globals */
import resampleJS from '../computations/resampleTo16bint';
import resampleWasm from '../computations/resampleTo16bint.wasm';

let resample = () => {};
let outputInputSampleRateRatio = 1 / 3;

/* Webpack renames resources which makes the locateFile function inside
resampleJS break. The function below replaces locateFile so as to give the
right name when loading the wasm binary.
*/
const resampleMod = resampleJS({
  locateFile(path) {
    if (path.endsWith('.wasm')) return resampleWasm;
    return path;
  },
});

//-----add by hao for a globle var translate resampleJS to resampleJS.then  begin
var thisresampleMod;
//-----add by hao for a globle var translate resampleJS to resampleJS.then  end
const helper = {
  //setConversionRatio(msg) {
  async setConversionRatio(msg) {
//-----add by hao for translate resampleJS to resampleJS.then  begin
	await  resampleMod.then(
        function(result){
           thisresampleMod=result;
           thisresampleMod.init();
           resample = thisresampleMod.resampleTo16bint;
        }
    );
//-----add by hao for translate resampleJS to resampleJS.then  end
    outputInputSampleRateRatio = msg.data.conversionRatio;
    return outputInputSampleRateRatio;
  },
  //resample(msg) {
  async resample(msg) {
    return resample(msg.data.buffer, outputInputSampleRateRatio);
  },
  async reset() {
	//resampleMod.reset();
    thisresampleMod.reset();
    return '';
  },
  async terminate() {
    //resampleMod.terminate();
    thisresampleMod.terminate();
    close();
    return '';
  },
};

onmessage = (msg) => {
  const { command } = msg.data;
  const response = { command, ok: true };
//-----add by hao for async function begin 
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
//-----add by hao for async function end

//  if (command in helper) response.value = helper[command](msg);
//  else {
//    response.ok = false;
//    response.value = new Error(`Unknown command '${command}'`);
//  }
//  postMessage(response);
};

//resampleMod.onRuntimeInitialized = () => {
//  resampleMod.init();
//  resample = resampleMod.resampleTo16bint;
//};

