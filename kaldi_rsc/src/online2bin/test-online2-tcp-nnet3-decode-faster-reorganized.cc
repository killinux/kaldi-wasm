int test_OnlineASR() {
  try {
    using namespace kaldi;
    using namespace fst;

    typedef kaldi::int32 int32;
    typedef kaldi::int64 int64;

    int argc = 15;
    const char *argv[] = {
      "onlineASR",
      "--ivector-extraction-config=english/conf/ivector.conf",
      "--mfcc-config=english/conf/mfcc_hires.conf",
      "--endpoint.silence-phones=1:2:3:4:5",
      "--beam=8", // 16
      "--lattice-beam=5", // 10
      "--max-active=1000", // 7000
      "--min-active=200",
      "--frame-subsampling-factor=3",
      "--acoustic-scale=1.0",
      "--output-period=0.5",
      "--produce_time=true",
      "english/final.mdl",
      "english/graph/HCLG.fst",
      "english/graph/words.txt"
    };

    OnlineASR asr(argc, argv);

    constexpr size_t length = 0.005*16000;
    int16 buf[length] = {0};
    int read_bytes = length*sizeof(int16);

    // read audio samples
    std::ifstream audio_input("english/raw_audio/10001-90210-01803.raw", std::ios::binary);
    std::cout << "Starting processing\n";
    for(int i=0; audio_input; ++i) {
      audio_input.seekg(i*read_bytes, ios_base::beg);
      audio_input.read((char *) &buf[0], read_bytes);
      std::string msg { asr.ProcessBuffer(buf, audio_input.gcount()/sizeof(int16)) };
      if (msg != "") std::cout << msg << '\n';
    }
    std::cout << "Last utterance of first file:\n"
              << asr.Reset() << '\n';

    audio_input = std::ifstream("english/raw_audio/coffeebreak006_02wonderfulmealofvittles_bm.raw", std::ios::binary);
    std::cout << "Processing file with multiple utterances\n";
    for(int i=0; audio_input; ++i) {
      audio_input.seekg(i*read_bytes, ios_base::beg);
      audio_input.read((char *) &buf[0], read_bytes);
      std::string msg { asr.ProcessBuffer(buf, audio_input.gcount()/sizeof(int16)) };
      if (msg != "") std::cout << msg << '\n';
    }
    std::cout << "Last utterance of second file:\n"
              << asr.Reset();

    audio_input.close();
    return 0;
  } catch (const std::exception &e) {
    std::cerr << e.what();
    return -1;
  }
}
