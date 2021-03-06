import React from "react";
import classNames from 'classnames';

import Header from "./header";
import Button from "./button";

class Menu extends React.Component {
  static propTypes = {
    children: React.PropTypes.node.isRequired
  };

  render() {
    let children = React.Children.toArray(this.props.children);

    // See if the first child is a header component
    let header;
    let buttons;
    if(children[0].type.displayName == "Menu.Header") {
      header = children[0];
      buttons = children.slice(1);
    } else {
      buttons = children;
    }

    // Toggle the presence of the top border in the list if there isn't a header
    let classes = classNames("list-reset mt0 mb4 py1 border-gray", {
      "border rounded": !header,
      "border-bottom border-left border-right rounded-bottom": header
    });

    return (
      <div>
        {header}
        <ul className={classes}>
          {buttons.map((b, i) => {
            return (
              <li key={i}>{b}</li>
              )
          })}
        </ul>
      </div>
    );
  }
}

Menu.Header = Header;
Menu.Button = Button;

export default Menu;
