import React from 'react';
import PropTypes from 'prop-types';

import { IconButton } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import FileCopyOutlinedIcon from '@material-ui/icons/FileCopyOutlined';
import BackspaceOutlinedIcon from '@material-ui/icons/BackspaceOutlined';

const styles = {
  component: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    maxHeight: '100%',
    width: '100%',
  },
  text: {
    border: '1px solid black',
    overflowY: 'scroll',
    flexGrow: '1',
    margin: '0',
    padding: '10px 0 0 10px',
    whiteSpace: 'pre-line',
  },
  buttons: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
};

class FullHeightTextArea extends React.Component {
  constructor(props) {
    super(props);

    this.copyToClipboard = this.copyToClipboard.bind(this);

    this.textAreaRef = React.createRef();
  }

  componentDidUpdate() {
    this.textAreaRef.current.scrollTop = this.textAreaRef.current.scrollHeight;
  }

  copyToClipboard() {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(this.textAreaRef.current);
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('copy');
  }

  render() {
    const {
      text,
      testid,
      onDeleteClick,
      classes,
    } = this.props;

    return (
      <div className={classes.component}>
        <p
          className={classes.text}
          data-testid={`${testid}.text`}
          ref={this.textAreaRef}
        >
          {text}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <IconButton
            onClick={this.copyToClipboard}
            data-testid={`${testid}.copyButton`}
          >
            <FileCopyOutlinedIcon />
          </IconButton>
          <IconButton
            onClick={onDeleteClick}
            data-testid={`${testid}.deleteButton`}
          >
            <BackspaceOutlinedIcon />
          </IconButton>
        </div>
      </div>
    );
  }
}

FullHeightTextArea.propTypes = {
  text: PropTypes.string,
  testid: PropTypes.string,
  onDeleteClick: PropTypes.func.isRequired,
  classes: PropTypes.objectOf(PropTypes.string).isRequired,
};

FullHeightTextArea.defaultProps = {
  text: '',
  testid: '',
};

export default withStyles(styles)(FullHeightTextArea);
