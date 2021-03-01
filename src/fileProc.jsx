import React from 'react';
import PropTypes from 'prop-types';

import IDBHandler from './workerWrappers/idbHandler';
import ASRHandler from './workerWrappers/asrHandler';
import downloadModelFromWeb from './utils/downloadModel';

const classes = {
  text: {
    border: '1px solid black',
    flexGrow: '1',
    margin: '0',
    overflowY: 'scroll',
    padding: '10px 0 0 10px',
    whiteSpace: 'pre-line',
  },
};

class FileDropPage extends React.Component {
  constructor(props) {
    super(props);

    this.loadAudioFile = this.loadAudioFile.bind(this);
    this.idbHandler = null;
    this.asrHandler = null;

    this.state = {
      texts: [],
      disabled: true,
    };
  }

  componentDidMount() {
    const { idbInfo, modelName } = this.props;
    this.idbHandler = new IDBHandler();
    this.asrHandler = new ASRHandler();

    this.idbHandler.init(idbInfo)
      .then(() => {
        this.updateText(`Retrieving model: ${modelName}`);
        return this.idbHandler.get(modelName);
      })
      .catch(() => this.downloadAndStore(modelName))
      .then(({ value: zip }) => {
        this.updateText('Initializing ASR');
        return this.asrHandler.init(modelName, zip);
      })
      .then(() => {
        const { texts } = this.state;
        this.setState({ texts: texts.concat('ASR ready'), disabled: false });
      })
      .catch((e) => this.updateText(e.message));
  }

  componentWillUnmount() {
    this.idbHandler.terminate();
    this.asrHandler.terminate();
  }

  downloadAndStore(modelName) {
    const { modelURLPrefix } = this.props;
    return new Promise((resolve, reject) => {
      downloadModelFromWeb(`${modelURLPrefix}/${modelName}`)
        .then((zip) => {
          this.idbHandler.add(modelName, zip)
            .catch(console.log)
            .finally(() => { resolve({ value: zip }); });
        })
        .catch(reject);
    });
  }

  updateText(newText) {
    const { texts } = this.state;
    texts.push(newText);
    this.forceUpdate();
  }

  loadAudioFile(evt) {
    const file = evt.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      this.setState({ disabled: true });
      const pcm = new Int16Array(ev.target.result);
      const start = Date.now();

      this.updateText('Processing started');
      this.asrHandler.process(pcm)
        .then(({ text }) => {
          this.updateText(`Processing duration: ${Date.now() - start} ms`);
          this.updateText(text);
          return this.asrHandler.reset();
        })
        .then(() => this.setState({ disabled: false }));
    };

    reader.readAsArrayBuffer(file);
  }

  render() {
    const { texts, disabled } = this.state;

    return (
      <div>
        <input type="file" onChange={this.loadAudioFile} disabled={disabled} />
        <p style={classes.text} id="pfield">
          { texts.join('\n') }
        </p>
      </div>
    );
  }
}

FileDropPage.propTypes = {
  modelName: PropTypes.string.isRequired,
  modelURLPrefix: PropTypes.string,
  idbInfo: PropTypes.shape({
    name: PropTypes.string,
    version: PropTypes.number,
    storeInfo: PropTypes.shape({
      name: PropTypes.string,
      keyPath: PropTypes.string,
    }),
  }),
};

FileDropPage.defaultProps = {
  modelURLPrefix: 'models',
  idbInfo: {
    name: 'asr_models',
    version: 1,
    storeInfo: {
      name: 'models',
      keyPath: 'language',
    },
  },
};

export default FileDropPage;
