import React from 'react';
import PropTypes from 'prop-types';
import AppsIcon from '@material-ui/icons/Apps';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
  iconStyle: {
    padding: '10px',
  },
});

export default function TopBar(props) {
  const { appName, onIconClick, disabledIcon } = props;
  const classes = useStyles();
  return (
    <AppBar position="static">
      <Toolbar disableGutters>
        <IconButton
          data-test="param-button"
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onIconClick}
          disabled={disabledIcon}
        >
          <AppsIcon className={classes.iconStyle} />
          <Typography variant="h6">
            { appName }
          </Typography>
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

TopBar.propTypes = {
  appName: PropTypes.string.isRequired,
  onIconClick: PropTypes.func.isRequired,
  disabledIcon: PropTypes.bool.isRequired,
};
