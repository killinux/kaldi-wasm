import ResamplerWorker from '../workers/resamplerWorker';
import WorkerWrapper from './workerWrapper';

export default class Resampler extends WorkerWrapper {
  constructor(streamSource, onResampled, bufferSize) {
    super(new ResamplerWorker());
    this.streamSource = streamSource;
    this.onResampled = onResampled;

    const { context } = this.streamSource;
    this.processor = context.createScriptProcessor(bufferSize, 1, 1);

    this.worker.onmessage = this.handleMessage.bind(this);
  }

  setSampleRate(targetSampleRate) {
    const { sampleRate } = this.streamSource.context;
    const conversionRatio = targetSampleRate / sampleRate;
    return this.promisify('setConversionRatio', { conversionRatio });
  }

  start() {
    this.processor.onaudioprocess = (evt) => {
      const data = evt.inputBuffer.getChannelData(0);
      this.worker.postMessage({
        command: 'resample',
        buffer: data,
      });
    };

    this.streamSource.connect(this.processor);
    const { context } = this.streamSource;
    this.processor.connect(context.destination);
  }

  stop() {
    this.processor.onaudioprocess = () => {};
    this.processor.disconnect();
    return this.promisify('reset');
  }

  terminate() {
    this.stop();
    this.processor = null;

    return this.promisify('terminate');
  }

  handleMessage(msg) {
    super.handleMessage(msg);
    const { command, value } = msg.data;
    if (command === 'resample') this.onResampled(value);
  }
}
