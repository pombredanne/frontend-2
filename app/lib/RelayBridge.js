import React from 'react';
import EventEmitter from 'eventemitter3';
import merge from 'deepmerge';

class RelayBridge extends EventEmitter {
  constructor() {
    super(...arguments);
    this.store = {};
  }

  find(id) {
    return this.store[id];
  }

  insert(id, data) {
    this.store[id] = merge(this.store[id] || {}, data);
  }

  update(id, data) {
    if(!this.store[id]) {
      throw new Error("No object with id `" + id + "` to update");
    }

    let updated = this.store[id] = merge(this.store[id] || {}, data);
    this.emit(id, id, updated);
    return updated;
  }

  createContainer(component, propertyToIdMapping) {
    let store = this;

    return class DataContainer extends React.Component {
      static displayName = `${component.displayName}RelayBridgeContainer`;

      constructor(props) {
        super(props);

        this.mappings = {}
        for(let property in propertyToIdMapping) {
          this.mappings[property] = propertyToIdMapping[property](this.props);
        }

        let state = {};
        for(let property in this.mappings) {
          state[property] = store.find(this.mappings[property]);
        }

        this.state = state;
      }

      componentDidMount() {
        for(let property in this.mappings) {
          store.on(this.mappings[property], this.handleDataChange);
        }
      }

      componentWillUnmount() {
        for(let property in this.mappings) {
          store.off(this.mappings[property], this.handleDataChange);
        }
      }

      render() {
        return React.createElement(component, merge(this.props, this.state));
      }

      handleDataChange = (id, data) => {
        let state = {}
        for(let property in this.mappings) {
          if(this.mappings[property] == id) {
            state[property] = data;
          }
        }

        this.setState(state);
      };
    };
  }
}

export default new RelayBridge()
