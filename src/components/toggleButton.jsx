import React from 'react';
import PropTypes from 'prop-types';

import Fab from '@material-ui/core/Fab';
import { Mic, Stop } from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  iconStyle: {
    marginRight: theme.spacing(1),
  },
}));

function Icon({ onStandby }) {
  const classes = useStyles();

  if (onStandby) {
    return <Mic fontSize="large" className={classes.iconStyle} />;
  }

  return <Stop fontSize="large" className={classes.iconStyle} />;
}

Icon.propTypes = {
  onStandby: PropTypes.bool,
};

Icon.defaultProps = {
  onStandby: true,
};

export default class ToggleButton extends React.Component {
  constructor(props) {
    super(props);

    this.toggle = this.toggle.bind(this);

    this.state = {
      onStandby: true,
    };
  }

  toggle() {
    const { onStandby } = this.state;
    if (onStandby) {
      const { onStart } = this.props;
      onStart();
      this.setState({ onStandby: false });
    } else {
      const { onStop } = this.props;
      onStop();
      this.setState({ onStandby: true });
    }
  }

  buttonLook() {
    const { onStandby } = this.state;
    const look = { ButtonIcon: () => Icon(onStandby) };
    if (onStandby) {
      look.buttonText = 'Start';
      look.color = 'primary';
    } else {
      look.buttonText = 'Stop';
      look.color = 'secondary';
    }
    return look;
  }

  render() {
    const { disabled } = this.props;
    const { buttonText, color } = this.buttonLook();
    const { onStandby } = this.state;

    return (
      <Fab
        color={color}
        disabled={disabled}
        onClick={this.toggle}
        size="large"
        variant="extended"
      >
        <Icon onStandby={onStandby} />
        {buttonText}
      </Fab>
    );
  }
}

ToggleButton.propTypes = {
  disabled: PropTypes.bool,
  onStart: PropTypes.func.isRequired,
  onStop: PropTypes.func.isRequired,
};

ToggleButton.defaultProps = {
  disabled: false,
};
