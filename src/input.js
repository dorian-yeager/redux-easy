const {string} = require('prop-types');
const React = require('react');
const {dispatchSet, getPathValue} = require('./redux-easy');

class Input extends React.Component {
  handleChange = event => {
    const {checked, value} = event.target;
    const {path, type} = this.props;
    dispatchSet(path, type === 'checkbox' ? checked : value);
  };

  render() {
    const {path, type} = this.props;
    const value = getPathValue(path);
    const propName = type === 'checkbox' ? 'checked' : 'value';
    const inputProps = {...this.props, [propName]: value};
    return <input {...inputProps} onChange={this.handleChange} />;
  }
}

Input.propTypes = {
  path: string.isRequired,
  type: string.isRequired
};

module.exports = Input;
