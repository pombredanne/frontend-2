import React from "react";
import { Link } from 'react-router';

import Icon from '../../shared/Icon';

class RowLink extends React.Component {
  static displayName = "Panel.RowLink";

  static propTypes = {
    children: React.PropTypes.node.isRequired,
    to: React.PropTypes.string.isRequired
  };

  render() {
    return (
      <Link to={this.props.to} className="btn py2 px3 flex items-center hover-bg-silver hover-black focus-black">
        <div className="flex-auto">
          {this.props.children}
        </div>
        <Icon icon="chevron-right" className="dark-gray" style={{height: 15, width: 15}} />
      </Link>
    );
  }
}

export default RowLink;
