import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';

export default class TrackingLink extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    href: PropTypes.string.isRequired,
    className: PropTypes.string,
    onTouchTap: PropTypes.func,
    targetBlank: PropTypes.bool,
    preventDefault: PropTypes.bool,
    trackingTimeout: PropTypes.number,
    contextMenuTimeout: PropTypes.number,
  };

  static defaultProps = {
    trackingTimeout: 500, // ms
    contextMenuTimeout: 300, // ms
  };

  /* istanbul ignore next */
  constructor(props) {
    super(props);

    this.state = {
      preventTouchTap: false,
    };

    this.addGlobalEvents = this.addGlobalEvents.bind(this);
    this.removeGlobalEvents = this.removeGlobalEvents.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);
    this.onTouchTap = this.onTouchTap.bind(this);
    this.navigateToUrl = this.navigateToUrl.bind(this);
    this.preventDefault = this.preventDefault.bind(this);
    this.resolveByTimeout = this.resolveByTimeout.bind(this);
  }

  componentDidMount() {
    this.addGlobalEvents();
  }

  componentWillUnmount() {
    this.removeGlobalEvents();
  }

  /**
   * In mobile Chrome and desktop Firefox opening context menu upon a link also triggers touchTap
   * That's why we must prevent touchTap for some small period of time
   */
  onContextMenu() {
    this.setState({ preventTouchTap: true });

    global.setTimeout(() => {
      this.setState({ preventTouchTap: false });
    }, this.props.contextMenuTimeout);
  }

  onTouchTap(ev) {
    const event = ev.nativeEvent;

    if (this.state.preventTouchTap) {
      return false;
    }

    const { onTouchTap: trackingFunction, trackingTimeout } = this.props;

    // try to track the click but with the timeout
    // in case of tracking-blocking browser extensions or failure to load analytics scripts
    return Promise
      .race([
        trackingFunction(),
        this.resolveByTimeout(trackingTimeout),
      ])
      .then(this.navigateToUrl(event));
  }

  addGlobalEvents() {
    global.window.addEventListener('contextmenu', this.onContextMenu);
  }

  removeGlobalEvents() {
    global.window.removeEventListener('contextmenu', this.onContextMenu);
  }

  navigateToUrl(event) {
    return () => {
      const {
        href,
        targetBlank,
        preventDefault,
      } = this.props;

      const ctrlKeyPressed = event.metaKey || event.ctrlKey;

      if (href && !preventDefault) {
        if (targetBlank || ctrlKeyPressed) {
          global.window.open(href, '_blank');
        } else {
          global.location.href = href;
        }
      }
    };
  }

  preventDefault(event) {
    event.preventDefault();
  }

  resolveByTimeout(timeout) {
    return new Promise(resolve => {
      global.setTimeout(resolve, timeout);
    });
  }

  render() {
    const {
      children,
      href,
      className: addtionalClassName,
      onTouchTap: trackingFunction,
    } = this.props;

    const className = classNames('TrackingLink', {
      [addtionalClassName]: !!addtionalClassName,
    });
    const onTouchTap = trackingFunction ? this.onTouchTap : undefined;

    return (
      <a
        className={className}
        href={href}
        onTouchTap={onTouchTap}
        onClick={this.preventDefault}
      >
        {children}
      </a>
    );
  }
}
