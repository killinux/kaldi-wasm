function _arrayToHeap(typedArray) {
  const numBytes = typedArray.length * typedArray.BYTES_PER_ELEMENT;
  const ptr = Module._malloc(numBytes);
  const heapBytes = new Float32Array(Module.HEAPF32.buffer, ptr, numBytes);
  heapBytes.set(new Float32Array(typedArray.buffer));

  return heapBytes;
}

function _shortArrayToHeap(typedArray) {
  const numBytes = typedArray.length * typedArray.BYTES_PER_ELEMENT;
  const ptr = Module._malloc(numBytes);
  const heapBytes = new Int16Array(Module.HEAP16.buffer, ptr, numBytes);
  heapBytes.set(new Int16Array(typedArray.buffer));

  return heapBytes;
}

function _freeArray(heapBytes) {
  Module._free(heapBytes.byteOffset);
}

Module.init = () => {
  const res = Module.ccall('init_converter', 'number');
  if (res !== 0) console.log('ERROR: could not initialize converter for resampling');
  return res;
};

Module.resampleTo16bint = (floatArray, inputSr) => {
  const heapBytes = _arrayToHeap(floatArray);
  const resBytes = _shortArrayToHeap(new Int16Array(floatArray.length));

  const written = Module.ccall('resample', 'number', ['number', 'number', 'number', 'number'],
    [heapBytes.byteOffset, floatArray.length, resBytes.byteOffset, inputSr]);

  const resampled = new Int16Array(resBytes.slice(0, written));

  _freeArray(heapBytes);
  _freeArray(resBytes);

  return resampled;
};

Module.reset = () => {
  const res = Module.ccall('reset', 'number');
  if (res !== 0) console.log('ERROR: Could not reset converter');
};

Module.terminate = () => {
  const res = Module.ccall('terminate', 'number');
  if (res !== 0) console.log('ERROR: Could not terminate converter');
};
