import IDBWorker from '../workers/idbWorker';
import WorkerWrapper from './workerWrapper';

export default class IDBHandler extends WorkerWrapper {
  constructor() {
    super(new IDBWorker());
  }

  init(idbInfo) {
    return this.promisify('init', { idbInfo });
  }

  get(modelName) {
    return this.promisify('get', { modelName });
  }

  add(modelName, zip) {
    return this.promisify('add', { modelName, zip });
  }

  terminate() {
    this.idbWorker.postMessage({ command: 'terminate' });
  }
}
