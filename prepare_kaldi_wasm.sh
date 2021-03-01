#!/bin/bash

set -e
set -o nounset

PROGRAM=online2-tcp-nnet3-decode-faster-reorganized
WASM_NAME=kaldiJS

EM_OPTS="-s WASM=1 -s MODULARIZE=1 -s ENVIRONMENT='worker' -s BUILD_AS_WORKER=1 \
         -s EXPORT_NAME='kaldiJS' -s EXTRA_EXPORTED_RUNTIME_METHODS=['FS'] \
         -s INVOKE_RUN=0 -s ERROR_ON_UNDEFINED_SYMBOLS=0 -s TOTAL_MEMORY=300MB \
         -s ALLOW_MEMORY_GROWTH=1 --bind -lidbfs.js"

curr_dir="$(pwd)"
cd kaldi/src/online2bin
#cp $PROGRAM $PROGRAM.bc
#em++ $EM_OPTS -o $WASM_NAME.js $PROGRAM.bc

em++ -msse -msse2 -msse3 -mssse3 -msse4.1 -msse4.2 -mavx  -msimd128 -s EXPORTED_FUNCTIONS=['_popen','_main']  $EM_OPTS    online2-tcp-nnet3-decode-faster-reorganized.o ../online2/kaldi-online2.a ../ivector/kaldi-ivector.a ../nnet3/kaldi-nnet3.a ../chain/kaldi-chain.a ../nnet2/kaldi-nnet2.a ../cudamatrix/kaldi-cudamatrix.a ../decoder/kaldi-decoder.a ../lat/kaldi-lat.a ../fstext/kaldi-fstext.a ../hmm/kaldi-hmm.a ../feat/kaldi-feat.a ../transform/kaldi-transform.a ../gmm/kaldi-gmm.a ../tree/kaldi-tree.a ../util/kaldi-util.a ../matrix/kaldi-matrix.a ../base/kaldi-base.a   ../../../kaldi/tools/openfst-1.6.7/lib/libfst.a ../../../clapack-wasm/CLAPACK-3.2.1/lapack.a ../../../clapack-wasm/CLAPACK-3.2.1/libcblaswr.a ../../../clapack-wasm/CBLAS/lib/cblas.a ../../../clapack-wasm/f2c_BLAS-3.8.0/blas.a ../../../clapack-wasm/libf2c/libf2c.a -lm  -ldl  -o  $WASM_NAME.js


mkdir -p "$curr_dir/src/computations"
mv $WASM_NAME.* "$curr_dir/src/computations"
#rm $PROGRAM.bc
cd "$curr_dir"
