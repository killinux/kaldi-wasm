import React from 'react';
import PropTypes from 'prop-types';

import { makeStyles } from '@material-ui/core/styles';

import TopBar from './topBar';

const useStyles = makeStyles({
  layout: {
    display: 'flex',
    flexDirection: 'column',
    height: '95vh',
    maxHeight: '95vh',
    width: '100vw',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    height: 'calc(100% - 68px)', // 68px == height of topBar
    maxHeight: 'calc(100% - 68px)',
    width: '100%',
  },
});

export default function Layout(props) {
  const {
    appName,
    children,
    disabledIcon,
    onIconClick,
  } = props;

  const classes = useStyles();

  return (
    <div className={classes.layout}>
      <TopBar
        appName={appName}
        onIconClick={onIconClick}
        disabledIcon={disabledIcon}
      />
      <div className={classes.content}>
        {children}
      </div>
    </div>
  );
}

Layout.propTypes = {
  appName: PropTypes.string.isRequired,
  disabledIcon: PropTypes.bool,
  children: PropTypes.node.isRequired,
  onIconClick: PropTypes.func,
};

Layout.defaultProps = {
  disabledIcon: false,
  onIconClick: () => {},
};
