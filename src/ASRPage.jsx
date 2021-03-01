import React from 'react';
import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core/styles';

import Layout from './components/layout';
import IDBHandler from './workerWrappers/idbHandler';
import ASRHandler from './workerWrappers/asrHandler';
import ResampleHandler from './workerWrappers/resamplerHandler';
import FullHeightTextArea from './components/fullHeightTextArea';
import DropDown from './components/dropDown';
import ToggleButton from './components/toggleButton';
import { trackedDownload } from './utils/downloadModel';
import ProgressBar from './components/meter';

const AudioContext = window.AudioContext || window.webkitAudioContext;

const STATUSES = {
  DOWNLOADING: 'downloading',
  ERROR: 'error',
  LOADING: 'loading',
  RUNNING: 'running',
  STANDBY: 'standby',
  UNINIT: 'uninit',
};

const STATUS_MESSAGE = {
  [STATUSES.DOWNLOADING]: 'Downloading model from the web. Please wait',
  [STATUSES.ERROR]: 'Oops something went wrong',
  [STATUSES.LOADING]: 'Starting ASR engine. Please wait',
  [STATUSES.RUNNING]: 'Running',
  [STATUSES.STANDBY]: 'ASR engine ready. Please click on button to start',
  [STATUSES.UNINIT]: '',
};

const STATUS_COLOR = {
  [STATUSES.ERROR]: 'red',
  [STATUSES.DOWNLOADING]: 'orange',
  [STATUSES.LOADING]: 'orange',
  [STATUSES.RUNNING]: 'black',
  [STATUSES.STANDBY]: 'green',
  [STATUSES.UNINIT]: 'black',
};


const styles = {
  control: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    width: '100%',
  },
  feedback: {
    padding: '5px',
  },
  resultStyle: {
    display: 'flex',
    justifyContent: 'center',
    maxWidth: '60%',
    width: '100%',
    height: 'calc(100% - 260px)', // 260px > max height of control div
    maxHeight: 'calc(100% - 252px)',
    flexGrow: '1',
  },
  params: {
    display: 'flex',
    justifyContent: 'space-evenly',
    width: '100%',
    maxWidth: '40%',
    flexWrap: 'wrap',
    padding: '15px',
  },
};

class ASRPage extends React.Component {
  constructor(props) {
    super(props);

    this.resetTexts = this.resetTexts.bind(this);
    this.onModelChange = this.onModelChange.bind(this);
    this.onResampled = this.onResampled.bind(this);
    this.startASR = this.startASR.bind(this);
    this.stopASR = this.stopASR.bind(this);
    this.updateProgress = this.updateProgress.bind(this);
    this.updateTranscription = this.updateTranscription.bind(this);

    this.idbHandler = null;
    this.asrHandler = null;
    this.resamplerHandler = null;
    this.prevIsFinal = false;

    this.state = {
      appStatus: STATUSES.UNINIT,
      transcriptions: [],
      tmpTranscription: 'Transcription',
      models: ['Choose a language'],
      interactionDisabled: false,
      disableRecordButton: true,
      downloadProgress: 100,
    };
  }

  componentDidMount() {
    const { resamplerBufferSize, modelURLPrefix, idbInfo } = this.props;
    this.idbHandler = new IDBHandler();
    this.asrHandler = new ASRHandler();

    this.idbHandler.init(idbInfo)
      .then((nameList) => this.updateModelList(nameList, modelURLPrefix))
      .catch(console.log);

    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then((stream) => {
        const context = new AudioContext();
        const audioSource = context.createMediaStreamSource(stream);
        this.resamplerHandler = new ResampleHandler(audioSource,
          this.onResampled, resamplerBufferSize);
      })
      .catch(console.log);
  }

  componentWillUnmount() {
    this.idbHandler.terminate();
    this.asrHandler.terminate();
    this.resamplerHandler.terminate();
  }

  onModelChange(modelName) {
    this.setState({
      interactionDisabled: true,
      appStatus: STATUSES.LOADING,
      disableRecordButton: true,
    });

    const newState = {
      appStatus: STATUSES.ERROR,
      disableRecordButton: false,
    };

    this.idbHandler.get(modelName)
      .catch(() => this.downloadAndStore(modelName))
      .then(({ value: zip }) => new Promise((resolve, reject) => {
        this.asrHandler.terminate()
          .then(() => { resolve(this.asrHandler.init(modelName, zip)); })
          .catch(reject);
      }))
      .then(() => this.asrHandler.getSampleRate())
      .then((asrSR) => this.resamplerHandler.setSampleRate(asrSR))
      .then(() => { newState.appStatus = STATUSES.STANDBY; })
      .catch(console.log)
      .finally(() => this.setState({
        interactionDisabled: false,
        ...newState,
      }));
  }

  onResampled(buffer) {
    this.asrHandler.process(buffer)
      .then(this.updateTranscription);
  }

  updateProgress(value) {
    this.setState({ downloadProgress: value * 100 });
  }

  downloadAndStore(modelName) {
    const { modelURLPrefix } = this.props;
    return new Promise((resolve, reject) => {
      this.setState({ appStatus: STATUSES.DOWNLOADING });
      trackedDownload(`${modelURLPrefix}/${modelName}`, this.updateProgress)
        .then((zip) => {
          this.idbHandler.add(modelName, zip)
            .catch(console.log)
            .finally(() => {
              this.setState({ appStatus: STATUSES.LOADING });
              resolve({ value: zip });
            });
        })
        .catch(reject);
    });
  }

  updateTranscription(transcription) {
    if (transcription === null) return;
    const { text, isFinal } = transcription;
    // skip streak of isFinal (i.e. repetition of final utterance)
    if (!this.prevIsFinal) {
      // bug: first trancript of new utterance always skipped
      if (isFinal && text !== '') {
        const { transcriptions } = this.state;
        this.setState({
          transcriptions: transcriptions.concat([text]),
          tmpTranscription: '',
        });
      } else {
        this.setState({ tmpTranscription: text });
      }
    }
    this.prevIsFinal = isFinal;
  }

  startASR() {
    this.setState({ disableRecordButton: true });

    this.resamplerHandler.start();
    this.setState({
      appStatus: STATUSES.RUNNING,
      disableRecordButton: false,
      interactionDisabled: true,
    });
  }

  stopASR() {
    this.setState({ disableRecordButton: true });

    const newState = {
      disableRecordButton: true,
      appStatus: STATUSES.ERROR,
    };

    this.resamplerHandler.stop()
      .then(() => this.asrHandler.reset())
      .then(this.updateTranscription)
      .then(() => {
        newState.appStatus = STATUSES.STANDBY;
        newState.disableRecordButton = false;
      })
      .catch(console.log)
      .finally(() => this.setState({
        interactionDisabled: false,
        ...newState,
      }));
  }

  updateModelList(storedModels, modelUrl) {
    let updatedList = storedModels;
    fetch(modelUrl)
      .then((res) => res.json())
      .then((webModels) => {
        updatedList = [...new Set(webModels.concat(updatedList))];
      })
      .catch(console.log)
      .finally(() => {
        const { models: prevModels } = this.state;
        this.setState({ models: prevModels.concat(updatedList) });
      });
  }

  resetTexts() {
    this.setState({ transcriptions: [''] });
  }

  render() {
    const {
      classes,
    } = this.props;

    const {
      transcriptions,
      tmpTranscription,
      appStatus,
      models,
      interactionDisabled,
      disableRecordButton,
      downloadProgress,
    } = this.state;

    const statusMessage = STATUS_MESSAGE[appStatus];
    const infoColor = STATUS_COLOR[appStatus];
    const text = transcriptions.concat(tmpTranscription).join('\n');

    return (
      <Layout appName="ASR">
        <div className={classes.control}>
          <div className={classes.params}>
            <DropDown
              label="Recognize"
              items={models}
              onChange={this.onModelChange}
              disabled={interactionDisabled}
            />
            <ToggleButton
              onStart={this.startASR}
              onStop={this.stopASR}
              disabled={disableRecordButton}
            />
          </div>
          <div className={classes.feedback}>
            <p>
              <font data-testid="connection-status" size="5" color={infoColor}>
                {statusMessage}
              </font>
            </p>
            {
              downloadProgress < 100
              && (
                <ProgressBar
                  height="10px"
                  value={downloadProgress}
                />
              )
            }
          </div>
        </div>
        <div className={classes.resultStyle}>
          <FullHeightTextArea
            testid="result-field"
            text={text}
            onDeleteClick={this.resetTexts}
          />
        </div>
      </Layout>
    );
  }
}

ASRPage.defaultProps = {
  resamplerBufferSize: 4096, // ~ 90 ms at 44.1kHz
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

ASRPage.propTypes = {
  resamplerBufferSize: PropTypes.number,
  modelURLPrefix: PropTypes.string,
  idbInfo: PropTypes.shape({
    name: PropTypes.string,
    version: PropTypes.number,
    storeInfo: PropTypes.shape({
      name: PropTypes.string,
      keyPath: PropTypes.string,
    }),
  }),
  classes: PropTypes.objectOf(PropTypes.string).isRequired,
};

export default withStyles(styles)(ASRPage);
