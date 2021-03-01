export default class WorkerWrapper {
  constructor(worker) {
    this.worker = worker;
    this.worker.onmessage = this.handleMessage;
  }

  promisify(command, data) {
    return new Promise((resolve, reject) => {
      window.addEventListener('fromWorker', (evt) => {
        const { command: echoedCommand, ok, value } = evt.detail;
        if (echoedCommand === command) {
          if (!ok) reject(new Error(`command "${command}" failed: ${value}`));
          resolve(value);
        }
      });
      this.worker.postMessage({ command, ...data });
    });
  }

  // eslint-disable-next-line class-methods-use-this
  handleMessage(msg) {
    const evt = new CustomEvent('fromWorker', { detail: msg.data });
    dispatchEvent(evt);
  }
}
