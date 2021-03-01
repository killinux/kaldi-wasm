#!/bin/bash

set -e
set -o nounset

emsdk_dir=${1:-'.'}
script_dir=$(pwd)

LAPACK_DIR=clapack-wasm

if [[ -z $(command -v emcc) ]]; then
    echo "Activating emcc env from $emsdk_dir"
    cd $emsdk_dir
    ./emsdk activate latest
    source ./emsdk_env.sh
    cd $script_dir
fi

wasm_ld="wasm-ld"
if [[ -z $(command -v $wasm_ld) ]]; then
    wasm_dir=$(dirname $(dirname $(which emcc)))
    echo "Adding path to $wasm_ld from $wasm_dir"
    export PATH="$wasm_dir/bin:$PATH"
    if [[ -z $(command -v $wasm_ld) ]]; then
        echo "ERROR: Cannot find $wasm_ld in $wasm_dir"
        exit 1;
    fi
fi

echo "------------ Building CLAPACK ------------"
cd ./clapack-wasm
bash install_repo.sh emcc
cd $script_dir

echo "------------ Copying modified Kaldi sources ------------"
for file in $(find kaldi_rsc -type f); do
    dir_dst=${file#kaldi_rsc/}
    cp $file kaldi/$dir_dst
done

echo "----------- Building Openfst -----------"
cd ./kaldi/tools
emmake make CFLAGS="-O3" CXXFLAGS="-O3 -s USE_ZLIB=1" LDFLAGS=-O3 openfst
cd $script_dir

echo "------------ Building Kaldi ------------"
./install_kaldi.sh $LAPACK_DIR

echo "------------ Creating WASM module ------------"
./prepare_kaldi_wasm.sh
./build_other_wasm.sh
