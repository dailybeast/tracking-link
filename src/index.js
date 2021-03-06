import React, { Component } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

export const MOUSE_RIGHT_BUTTON = 2;

export default class TrackingLink extends Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    href: PropTypes.string.isRequired,
    className: PropTypes.string,
    onClick: PropTypes.func,
    targetBlank: PropTypes.bool,
    preventDefault: PropTypes.bool,
    trackingTimeout: PropTypes.number
  };

  static defaultProps = {
    trackingTimeout: 500, // ms
  };

  /* istanbul ignore next */
  constructor(props) {
    super(props);

    this.linkEl = null;

    this.onClick = this.onClick.bind(this);
    this.navigateToUrl = this.navigateToUrl.bind(this);
    this.resolveByTimeout = this.resolveByTimeout.bind(this);
    this.isMouseWheelClick = this.isMouseWheelClick.bind(this);
    this.isChrome = this.isChrome.bind(this);
  }

  onClick(event) {
    event.preventDefault();

    const nativeEvent = event.nativeEvent;

    // on Windows right click triggers touchTap event (react-tap-event-plugin bug)
    if (nativeEvent.button === MOUSE_RIGHT_BUTTON) {
      return false;
    }

    const { onClick: trackingFunction, trackingTimeout } = this.props;

    // try to track the click but with the timeout
    // in case of tracking-blocking browser extensions or failure to load analytics scripts
    return Promise
      .race([
        trackingFunction(event),
        this.resolveByTimeout(trackingTimeout),
      ])
      .then(this.navigateToUrl(nativeEvent));
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
      onClick: trackingFunction,
    } = this.props;

    const className = classNames('TrackingLink', {
      [addtionalClassName]: !!addtionalClassName,
    });
    const onClick = trackingFunction ? this.onClick : undefined;

    return (
      <a
        className={className}
        href={href}
        onClick={onClick}
        ref={linkEl => { this.linkEl = linkEl; }}
      >
        {children}
      </a>
    );
  }
}
