import {func, string} from 'prop-types';
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {dispatchSet, getPathValue} from './redux-easy';

let thePath;

class Select extends Component {

  ref = null;

  handleChange = event => {
    const {value} = event.target;
    const {onChange, path} = this.props;
    dispatchSet(path, value);
    if (onChange) onChange(event);
  };

  render() {
    const {children, path} = this.props;
    thePath = path; // used by mapState below

    let {value} = this.props;
    if (!value) value = getPathValue(path);
    if (value === undefined) value = '';

    const selectProps = {...this.props, value};
    delete selectProps.dispatch;

    return (
      <select
        {...selectProps}
        onChange={this.handleChange}
        ref={select => this.ref = select}
      >
        {children}
      </select>
    );
  }
}

Select.propTypes = {
  onChange: func,
  path: string.isRequired,
  type: string,
  value: string
};

function mapState(state) {
  return thePath ? {value: getPathValue(thePath)} : {};
}

export default connect(mapState)(Select);