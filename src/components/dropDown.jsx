import React from 'react';
import PropTypes from 'prop-types';

import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@material-ui/core';


export default function DropDown({
  label,
  items,
  keys,
  defaultValue,
  disabled,
  onChange,
}) {
  if (items === []) return null;

  let usedKeys = items;
  let usedDefault = items[0];

  if (keys !== undefined && keys.length !== items.length) usedKeys = keys;
  if (defaultValue !== undefined) usedDefault = defaultValue;

  const [choice, setChoice] = React.useState(usedDefault);
  const changeClb = (event) => {
    const newValue = event.target.value;
    setChoice(newValue);
    onChange(newValue);
  };

  return (
    <FormControl disabled={disabled}>
      <InputLabel>{label}</InputLabel>
      <Select
        value={choice}
        onChange={changeClb}
      >
        { items.map((item, index) => (
          <MenuItem key={usedKeys[index]} value={item}>
            {item}
          </MenuItem>
        )) }
      </Select>
    </FormControl>
  );
}

DropDown.propTypes = {
  label: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.string).isRequired,
  keys: PropTypes.arrayOf(PropTypes.string),
  defaultValue: PropTypes.string,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
};

DropDown.defaultProps = {
  keys: undefined,
  defaultValue: undefined,
  onChange: () => {},
  disabled: false,
};
