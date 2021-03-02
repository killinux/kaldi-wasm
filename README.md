最终样子：



# 需要注意的点

1.先编译clapack-wasm 线性代数库 
2.再编译kaldi/tools下的openfst，这里注意要禁用动态库，在tools/Makefile里--enable-shared改成--disable-shared，否则emcc动态库不完全符合linux和mac的编译方式
3.编译kaldi/src下的内容，最终接口都在online2bin下，wasm新增了一个出口：online2-tcp-nnet3-decode-faster-reorganized.cc，从这步开始编译优化选项-O0，方便调试
4.编译解码器到src/computations 下 
5.启动node服务，模型文件需要放在dummy_serv/public 下(https://github.com/killinux/kaldi-wasm-zips)去这里下载

2020.03.02更新,注意git代码的版本

# 需要的包：
把kaldi和  clapack-wasm copy到 kaldi-wasm下
```shell
cd kaldi-wasm
git clone https://gitlab.inria.fr/kaldi.web/clapack-wasm
git clone https://github.com/kaldi-asr/kaldi
cp openfst-1.6.7.tar.gz  kaldi-wasm/kaldi/tools

cd kaldi-wasm/kaldi
git log
commit 031fcb2baa1e4e050935d4d913d8b5070f975c7b (HEAD -> master, origin/master, origin/HEAD)
Author: Xiang Li <heibaidaolx123@gmail.com>
Date:   Wed Dec 2 14:07:16 2020 +0800

    [src] cudadecoder: fix bug of frame range checking in online spetral kernels (#4360)


cd kaldi-wasm
git log
commit ccdf531509098ae3eeaf19b708b7db64d01ec09c (HEAD -> master, origin/master, origin/HEAD)
Merge: e38c239 4a0950f
Author: HU Mathieu <mathieu.hu@inria.fr>
Date:   Wed Dec 9 09:13:21 2020 +0100

    Merge branch 'dev/update_kaldi' into 'master'

    Update kaldi with latest version

    See merge request kaldi.web/kaldi-wasm!19
```


# 环境：
```
emcc --version
emcc (Emscripten gcc/clang-like replacement + linker emulating GNU ld) 2.0.14 (8dd277d191daee9adfad03e5f0663df2db4b8bb1)
Copyright (C) 2014 the Emscripten authors (see AUTHORS.txt)
This is free and open source software under the MIT license.
There is NO warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

uname -a
Linux ali0227 5.4.0-65-generic #73-Ubuntu SMP Mon Jan 18 17:25:17 UTC 2021 x86_64 x86_64 x86_64 GNU/Linux
```

存在问题：
popen undefine的问题是搞不定的，放弃吧，忽略他 -s ERROR_ON_UNDEFINED_SYMBOLS=0



安装：和修改的内容：
关键点：./install_kaldi.sh 之后需要 编译优化成-O0

# 安装步骤：

# 1. 安装CLAPACK不需要修改，直接在install.sh里面就可以

```shell

echo "------------ Building CLAPACK ------------"
cd ./clapack-wasm
bash install_repo.sh emcc
cd $script_dir

```

# 2.安装kaldi/tools 
在ubuntu下，是不是动态库有问题，需要disable一下shared

vim kaldi-wasm/kaldi/toos/Makefile
```shell
OPENFST_CONFIGURE ?= --enable-static --enable-shared --enable-far \
                     --enable-ngram-fsts --enable-lookahead-fsts --with-pic
```
改成
```shell
OPENFST_CONFIGURE ?= --enable-static --disable-shared --enable-far \
                     --enable-ngram-fsts --enable-lookahead-fsts --with-pic
```

可以省去这些-rpath的警告
```javascript
em++: warning: ignoring dynamic library libfstfar.so because not compiling to JS or HTML, remember to link it when compiling to JS or HTML at the end [-Wemcc]
em++: warning: ignoring dynamic library libfstscript.so because not compiling to JS or HTML, remember to link it when compiling to JS or HTML at the end [-Wemcc]
em++: warning: ignoring dynamic library libfst.so because not compiling to JS or HTML, remember to link it when compiling to JS or HTML at the end [-Wemcc]
em++: warning: linking a library with `-shared` will emit a static object file.  This is a form of emulation to support existing build systems.  If you want to build a runtime shared library use the SIDE_MODULE setting. [-Wemcc]
em++: warning: ignoring unsupported linker flag: `-rpath` [-Wlinkflags]
em++: warning: ignoring unsupported linker flag: `-rpath` [-Wlinkflags]
em++: warning: ignoring unsupported linker flag: `-rpath` [-Wlinkflags]
em++: warning: ignoring unsupported linker flag: `-rpath` [-Wlinkflags]
em++: warning: ignoring unsupported linker flag: `-soname` [-Wlinkflags]
```
思考： 是否是哪些undefine的问题也是因为动态库的问题 ，看来是了，在ubuntu20.04下，undefine的错误和奇怪的警告不见了



install.sh中的
```shell
echo "----------- Building Openfst -----------"
cd ./kaldi/tools
emmake make CFLAGS="-O3" CXXFLAGS="-O3 -s USE_ZLIB=1" LDFLAGS=-O3 openfst
cd $script_dir
```
这个不变,注意禁用动态库就好



# 3.安装kaldi 

这个需要修改-O0和-s ERROR_ON_UNDEFINED_SYMBOLS=0 ，把popen和main的错误变成警告

```shell
echo "------------ Building Kaldi ------------"
#./install_kaldi.sh $LAPACK_DIR
CXXFLAGS="-O0 -U HAVE_EXECINFO_H -msse -msse2 -msse3 -mssse3 -msse4.1 -msse4.2 -mavx  -msimd128"
LDFLAGS="-O0 -s ERROR_ON_UNDEFINED_SYMBOLS=0 -s EXPORTED_FUNCTIONS=['_main'] --bind"

# this -O0 need then
```

最终生成的kaldi.mk ,这里需要用sed 把-O1改成-O0，另外DEBUG_LEVEL不要修改

```shell
cd kaldi/src
CXXFLAGS="$CXXFLAGS" LDFLAGS="$LDFLAGS" emconfigure ./configure --use-cuda=no \
    --static --clapack-root=../../"$LAPACK_DIR" --host=WASM

sed -i -e 's:-pthread::g; s:-lpthread::g' kaldi.mk
#sed -i -e 's:-O1:-O0:g; s:DEBUG_LEVEL = 1:DEBUG_LEVEL = 2:g' kaldi.mk
sed -i -e 's:-O1:-O0:g; ' kaldi.mk

emmake make -j clean depend
#emmake make -j $(nproc) online2bin
emmake make  online2bin
```

注意5个地方：
（1）。需要-O0，configure之后会生成 kaldi-wasm/kaldi/src/kaldi.mk
大部分参数都在这里 ，所以要sed把-O1的部分都改成-O0
（2）这个 -msse -msse2 -msse3 -mssse3 -msse4.1 -msse4.2 -mavx  -msimd128 的支持，没有浏览器会报错，
（3） ERROR_ON_UNDEFINED_SYMBOLS=0 ，popen和main的问题似乎忽略不掉，主要是这两个的undefined错误给屏蔽掉
（4）需要--bind ，__em_regist_class类似的错误会存在undefined错误，加个这个就好了
（5） 如果出现大量undefine，别急着去用ERROR_ON_UNDEFINED_SYMBOLS 屏蔽，有可能是动态库的问题，尝试用静态库解决，也不要急着用-s EXPORT_ALL=1，去解决，因为生成的包太大了，



# 4. 把编译后的kaldi的基础组件拼接器来，编译出解码器

主要是 online2-tcp-nnet3-decode-faster-reorganized.cc 生成到 kaldiJS.js和kaldiJS.wasm到

kaldi-wasm/src/computations下

prepare_kaldi_wasm.sh
中要修改
奇怪，官方 
cp $PROGRAM $PROGRAM.bc
这玩意想直接就用？？？？？什么原理，怎么想的，难道有什么隐含逻辑没搞懂？？

去官方的ci里看编译过程，修改如下
```shell
#cp $PROGRAM $PROGRAM.bc
#em++ $EM_OPTS -o $WASM_NAME.js $PROGRAM.bc
```
把这两行改成

```shell
em++ -msse -msse2 -msse3 -mssse3 -msse4.1 -msse4.2 -mavx  -msimd128 -s EXPORTED_FUNCTIONS=['_popen','_main']  $EM_OPTS    online2-tcp-nnet3-decode-faster-reorganized.o ../online2/kaldi-online2.a ../ivector/kaldi-ivector.a ../nnet3/kaldi-nnet3.a ../chain/kaldi-chain.a ../nnet2/kaldi-nnet2.a ../cudamatrix/kaldi-cudamatrix.a ../decoder/kaldi-decoder.a ../lat/kaldi-lat.a ../fstext/kaldi-fstext.a ../hmm/kaldi-hmm.a ../feat/kaldi-feat.a ../transform/kaldi-transform.a ../gmm/kaldi-gmm.a ../tree/kaldi-tree.a ../util/kaldi-util.a ../matrix/kaldi-matrix.a ../base/kaldi-base.a   /opt/emscripten/kaldi-wasm/kaldi/tools/openfst-1.6.7/lib/libfst.a /opt/emscripten/kaldi-wasm/clapack-wasm/CLAPACK-3.2.1/lapack.a /opt/emscripten/kaldi-wasm/clapack-wasm/CLAPACK-3.2.1/libcblaswr.a /opt/emscripten/kaldi-wasm/clapack-wasm/CBLAS/lib/cblas.a /opt/emscripten/kaldi-wasm/clapack-wasm/f2c_BLAS-3.8.0/blas.a /opt/emscripten/kaldi-wasm/clapack-wasm/libf2c/libf2c.a -lm  -ldl  -o  $WASM_NAME.js
```
或者相对位置
```shell
em++ -msse -msse2 -msse3 -mssse3 -msse4.1 -msse4.2 -mavx  -msimd128 -s EXPORTED_FUNCTIONS=['_popen','_main']  $EM_OPTS    online2-tcp-nnet3-decode-faster-reorganized.o ../online2/kaldi-online2.a ../ivector/kaldi-ivector.a ../nnet3/kaldi-nnet3.a ../chain/kaldi-chain.a ../nnet2/kaldi-nnet2.a ../cudamatrix/kaldi-cudamatrix.a ../decoder/kaldi-decoder.a ../lat/kaldi-lat.a ../fstext/kaldi-fstext.a ../hmm/kaldi-hmm.a ../feat/kaldi-feat.a ../transform/kaldi-transform.a ../gmm/kaldi-gmm.a ../tree/kaldi-tree.a ../util/kaldi-util.a ../matrix/kaldi-matrix.a ../base/kaldi-base.a   ../../../kaldi/tools/openfst-1.6.7/lib/libfst.a ../../../clapack-wasm/CLAPACK-3.2.1/lapack.a ../../../clapack-wasm/CLAPACK-3.2.1/libcblaswr.a ../../../clapack-wasm/CBLAS/lib/cblas.a ../../../clapack-wasm/f2c_BLAS-3.8.0/blas.a ../../../clapack-wasm/libf2c/libf2c.a -lm  -ldl  -o  $WASM_NAME.js
```



------------ Creating WASM module ------------
warning: undefined symbol: MAIN__ (referenced by top-level compiled C/C++ code)
warning: undefined symbol: popen (referenced by top-level compiled C/C++ code)

这俩忽略吧，因为有这个在 -s ERROR_ON_UNDEFINED_SYMBOLS=0，否则就报错了，popen查了半天就是不支持，到浏览器里就好了


# 5. 编译采样率的js ，把-O3改成-O0

build_other_wasm.sh
```shell
#emcc -O3 -s WASM=1 -s MODULARIZE=1 -s ENVIRONMENT='worker' -s BUILD_AS_WORKER=1 \

emcc -O0 -s WASM=1 -s MODULARIZE=1 -s ENVIRONMENT='worker' -s BUILD_AS_WORKER=1 \
     -s EXTRA_EXPORTED_RUNTIME_METHODS="['ccall']" \
     -s EXPORT_NAME='resampleTo16bint' \
     --post-js audio-resampler/em_src/resampleTo16bint_post.js \
     -I audio-resampler/src -o src/computations/resampleTo16bint.js \
     audio-resampler/em_src/resampleTo16bint.c audio-resampler/src/*.c
```

# 6.把模型相关文件放到相应位置 就启动npm start

kaldi-wasm/dummy_serv/public/english_small.zip
english_small.zip 去https://github.com/killinux/kaldi-wasm-zips 下载

这个模型的结构是这样的

.
├── AUTHORS
├── conf
│   ├── ivector.conf
│   └── mfcc_hires.conf
├── english_small.zip
├── extractor
│   ├── final.dubm
│   ├── final.ie
│   ├── final.mat
│   ├── global_cmvn.stats
│   ├── online_cmvn.conf
│   └── splice_opts
├── final.mdl
├── graph
│   ├── HCLG.fst
│   └── words.txt
├── kaldi_config.json
├── LICENSE
└── README.md


# 7.修改nodejs相关配置，让外网也能访问

vim webpack.config.js
```javascript
module.exports = {
  devServer: {
    host: 'localhost',
    https: true,
    proxy: {
      '/models': {
        target: 'http://localhost:3000',
      },
    },
  },
````
localhost改成server的ip

vim package.json
```javascript
"scripts": {
    "start": "(cd dummy_serv && node server.js) & webpack-dev-server --open",
```
改成
```javascript
"scripts": {
	"start": "(cd dummy_serv && node server.js) & webpack-dev-server --host 0.0.0.0 --open",
````

npm install
npm start 

浏览器打开https 的8080端口

7. 会存在同步异步的问题 ，需要修改一下前端的代码


kaldi-wasm/src/workers/resamplerWorker.js
去掉 onRuntimeInitialized相关内容
helper中的相关方法全都改成async 前缀  ，参考asrWorker.js里面改的，以为你喂要加载resampleJS 对象，需要用then调用
新建一个thisresampleMod 作为 resampleJS.then之后的返回对象



最后几行改成这样
```javascript
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
```

helper里面修改，这里调用了then
```javascript
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
```



下面修改asrWorker.js如果不改 会报类似：
Error: command "init" failed: TypeError: Cannot read property 'mkdir' of undefined
    at eval (workerWrapper.js:19)
    at Worker.handleMessage (workerWrapper.js:35)

这个是因为kaldiJS 没有then ，对象里的FS没有生成

尝试修改 asrWorker.js

新增 var thisModule; 作为kaldiJS.then返回的对象保存 注意把kaldiModule 都改成thisModule
```javascript
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
```
另一个地方：

```javascript

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
```
#########检查编译通过

ubuntu20.04 编译通过
macOS Big Sur 版本11.1 编译通过
CentOS Linux release 7.9.2009 (Core) 编译通过
emscripten 1.40.1  编译通过
emscripten 1.40.0  编译通过
emscripten 2.0.14  编译通过

备注：
chrome调试的时候偶尔可能会永奥
cd /Applications/Google Chrome.app/Contents/MacOS
./Google\ Chrome --js-flags="--experimental-wasm-simd"





























