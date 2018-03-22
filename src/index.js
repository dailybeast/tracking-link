import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const MOUSE_RIGHT_BUTTON = 2;
export const EVENT = {
  CONTEXT_MENU: 'contextmenu',
  TOUCH_START: 'touchstart',
  TOUCH_END: 'touchend',
};

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
    this.isMouseWheelClick = this.isMouseWheelClick.bind(this);
    this.isChrome = this.isChrome.bind(this);
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

  onTouchTap(event) {
    const nativeEvent = event.nativeEvent;

    if (this.state.preventTouchTap) {
      return false;
    }

    // on Windows right click triggers touchTap event (react-tap-event-plugin bug)
    if (nativeEvent.button === MOUSE_RIGHT_BUTTON) {
      return false;
    }

    const { onTouchTap: trackingFunction, trackingTimeout } = this.props;

    // try to track the click but with the timeout
    // in case of tracking-blocking browser extensions or failure to load analytics scripts
    return Promise
      .race([
        trackingFunction(event),
        this.resolveByTimeout(trackingTimeout),
      ])
      .then(this.navigateToUrl(nativeEvent));
  }

  addEvents() {
    global.window.addEventListener(EVENT.CONTEXT_MENU, this.onContextMenu);
    this.linkEl.addEventListener(EVENT.TOUCH_START, this.onTouchStart);
    this.linkEl.addEventListener(EVENT.TOUCH_END, this.onTouchEnd);
  }

  removeEvents() {
    global.window.removeEventListener(EVENT.CONTEXT_MENU, this.onContextMenu);
    this.linkEl.removeEventListener(EVENT.TOUCH_START, this.onTouchStart);
    this.linkEl.removeEventListener(EVENT.TOUCH_END, this.onTouchEnd);
  }

  navigateToUrl(event) {
    return () => {
      const {
        href,
        targetBlank,
        preventDefault,
      } = this.props;

      const ctrlKeyPressed = event.metaKey || event.ctrlKey;
      const mouseWheelClick = this.isMouseWheelClick(event);
      const isChrome = this.isChrome();

      // in chrome it's not possible to prevent opening a new tab on mouse wheel click
      // so we prevent opening url in the current tab and allow to open it in a new tab by Chrome
      // for other browsers we'll open in a new tab
      if (mouseWheelClick && isChrome) {
        return false;
      }

      if (href && !preventDefault) {
        if (targetBlank || ctrlKeyPressed || (mouseWheelClick && !isChrome)) {
          global.window.open(href, '_blank');
        } else {
          global.location.href = href;
        }
      }

      return true;
    };
  }

  preventDefault(event) {
    event.preventDefault();
    return false;
  }

  resolveByTimeout(timeout) {
    return new Promise(resolve => {
      global.setTimeout(resolve, timeout);
    });
  }

  isMouseWheelClick(event) {
    let mouseWheelClick = false;

    if (event.which && event.which === 2) {
      mouseWheelClick = true;
    } else if (event.button && event.button === 1) {
      mouseWheelClick = true;
    }

    return mouseWheelClick;
  }

  isChrome() {
    return global.navigator.userAgent.indexOf('Chrome') > -1;
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
