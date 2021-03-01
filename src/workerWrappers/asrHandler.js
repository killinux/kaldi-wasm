import ASRWorker from '../workers/asrWorker';
import WorkerWrapper from './workerWrapper';

export default class ASR extends WorkerWrapper {
  constructor() {
    super(new ASRWorker());
  }

  init(modelName, zip) {
    return this.promisify('init', { modelName, zip });
  }

  getSampleRate() {
    return this.promisify('samplerate');
  }

  process(pcm) {
    return this.promisify('process', { pcm });
  }

  reset(zippedModel) {
    return this.promisify('reset', { zippedModel });
  }

  terminate() {
    return this.promisify('terminate');
  }
}
