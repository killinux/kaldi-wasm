import React from 'react';
import PropTypes from 'prop-types';

import { makeStyles, lighten } from '@material-ui/core/styles';

const useStyles = makeStyles({
  progressStyle: ({
    reverse,
    color,
    width,
    height,
    isHorizontal,
  }) => ({
    background: lighten(color, 0.75),
    position: 'relative',
    border: '0',
    overflow: 'hidden',
    transform: reverse ? 'rotate(180deg)' : '',
    width: width || (isHorizontal ? '100%' : '15px'),
    height: height || (isHorizontal ? '15px' : '100%'),
  }),
  fillerStyle: ({ color, isHorizontal, value }) => ({
    height: '100%',
    width: '100%',
    background: color,
    transitionProperty: 'none',
    transform: isHorizontal ? `translateX(${value - 100}%)`
      : `translateY(${value - 100}%)`,
  }),
});

function Meter(props) {
  const classes = useStyles(props);

  return (
    <div className={classes.progressStyle}>
      <div className={classes.fillerStyle} />
    </div>
  );
}

Meter.propTypes = { /* eslint-disable react/no-unused-prop-types */
  value: PropTypes.number,
  reverse: PropTypes.bool,
  isHorizontal: PropTypes.bool,
  color: PropTypes.string,
  width: PropTypes.string,
  height: PropTypes.string,
};

Meter.defaultProps = {
  value: 50,
  reverse: false,
  isHorizontal: true,
  color: '#ff6c5c',
  width: undefined,
  height: undefined,
};

export default Meter;
