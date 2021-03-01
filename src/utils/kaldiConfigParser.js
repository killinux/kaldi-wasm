const CONFIG_FILE = 'kaldi_config.json';
const DEFAULT_SR = 16000;

class KaldiConfigParser {
  /* Kaldi config file parser
   * fileSystem: Emscripten filesystem object
   * absBaseDir: Absolute path of directory with config file
   */
  constructor(fileSystem, absBaseDir) {
    this.absBaseDir = absBaseDir;
    const cwd = fileSystem.cwd();
    fileSystem.chdir(absBaseDir);

    const config = fileSystem.readFile(CONFIG_FILE, { encoding: 'utf8' });
    this.config = JSON.parse(config);

    fileSystem.chdir(cwd);
  }

  getSampleRate() {
    return +this.config.opts['--samp-freq'] || DEFAULT_SR;
  }

  createOptions() {
    return Object.entries(this.config.opts).reduce((res, pair) => {
      res.push(pair.join('='));
      return res;
    }, []);
  }

  createArgs() {
    let args = ['OnlineASR'];
    args = args.concat(this.createOptions());
    args = args.concat(this.config.args);
    return args;
  }
}

export default KaldiConfigParser;
