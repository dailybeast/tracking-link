import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';

export const MOUSE_RIGHT_BUTTON = 2;

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

    this.linkEl = null;
    this.longTouchTimer = 0;

    this.state = {
      preventTouchTap: false,
    };

    this.addEvents = this.addEvents.bind(this);
    this.removeEvents = this.removeEvents.bind(this);
    this.onContextMenu = this.onContextMenu.bind(this);
    this.onTouchStart = this.onTouchStart.bind(this);
    this.onTouchEnd = this.onTouchEnd.bind(this);
    this.onLongTouch = this.onLongTouch.bind(this);
    this.onTouchTap = this.onTouchTap.bind(this);
    this.navigateToUrl = this.navigateToUrl.bind(this);
    this.preventDefault = this.preventDefault.bind(this);
    this.resolveByTimeout = this.resolveByTimeout.bind(this);
  }

  componentDidMount() {
    this.addEvents();
  }

  componentWillUnmount() {
    this.removeEvents();
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

  onLongTouch() {
    this.setState({ preventTouchTap: true });
  }

  onTouchStart() {
    this.longTouchTimer = global.setTimeout(this.onLongTouch, 1000);
  }

  onTouchEnd() {
    global.window.clearTimeout(this.longTouchTimer);

    if (this.state.preventTouchTap) {
      global.setTimeout(() => {
        this.setState({ preventTouchTap: false });
      }, this.props.contextMenuTimeout);
    }
  }

  onTouchTap(ev) {
    const event = ev.nativeEvent;

    if (this.state.preventTouchTap) {
      return false;
    }

    // on Windows right click triggers touchTap event (react-tap-event-plugin bug)
    if (event.button === MOUSE_RIGHT_BUTTON) {
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

  addEvents() {
    global.window.addEventListener('contextmenu', this.onContextMenu);
    this.linkEl.addEventListener('touchstart', this.onTouchStart);
    this.linkEl.addEventListener('touchend', this.onTouchEnd);
  }

  removeEvents() {
    global.window.removeEventListener('contextmenu', this.onContextMenu);
    this.linkEl.removeEventListener('touchstart', this.onTouchStart);
    this.linkEl.removeEventListener('touchend', this.onTouchEnd);
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
        ref={linkEl => { this.linkEl = linkEl; }}
      >
        {children}
      </a>
    );
  }
}
