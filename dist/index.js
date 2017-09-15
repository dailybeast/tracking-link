'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var TrackingLink = function (_Component) {
  _inherits(TrackingLink, _Component);

  /* istanbul ignore next */
  function TrackingLink(props) {
    _classCallCheck(this, TrackingLink);

    var _this = _possibleConstructorReturn(this, (TrackingLink.__proto__ || Object.getPrototypeOf(TrackingLink)).call(this, props));

    _this.linkEl = null;
    _this.longTouchTimer = 0;

    _this.state = {
      preventTouchTap: false
    };

    _this.addEvents = _this.addEvents.bind(_this);
    _this.removeEvents = _this.removeEvents.bind(_this);
    _this.onContextMenu = _this.onContextMenu.bind(_this);
    _this.onTouchStart = _this.onTouchStart.bind(_this);
    _this.onTouchEnd = _this.onTouchEnd.bind(_this);
    _this.onLongTouch = _this.onLongTouch.bind(_this);
    _this.onTouchTap = _this.onTouchTap.bind(_this);
    _this.navigateToUrl = _this.navigateToUrl.bind(_this);
    _this.preventDefault = _this.preventDefault.bind(_this);
    _this.resolveByTimeout = _this.resolveByTimeout.bind(_this);
    return _this;
  }

  _createClass(TrackingLink, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.addEvents();
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.removeEvents();
    }

    /**
     * In mobile Chrome and desktop Firefox opening context menu upon a link also triggers touchTap
     * That's why we must prevent touchTap for some small period of time
     */

  }, {
    key: 'onContextMenu',
    value: function onContextMenu() {
      var _this2 = this;

      this.setState({ preventTouchTap: true });

      global.setTimeout(function () {
        _this2.setState({ preventTouchTap: false });
      }, this.props.contextMenuTimeout);
    }
  }, {
    key: 'onLongTouch',
    value: function onLongTouch() {
      this.setState({ preventTouchTap: true });
    }
  }, {
    key: 'onTouchStart',
    value: function onTouchStart() {
      this.longTouchTimer = global.setTimeout(this.onLongTouch, 1000);
    }
  }, {
    key: 'onTouchEnd',
    value: function onTouchEnd() {
      var _this3 = this;

      global.window.clearTimeout(this.longTouchTimer);

      if (this.state.preventTouchTap) {
        global.setTimeout(function () {
          _this3.setState({ preventTouchTap: false });
        }, this.props.contextMenuTimeout);
      }
    }
  }, {
    key: 'onTouchTap',
    value: function onTouchTap(ev) {
      var event = ev.nativeEvent;

      if (this.state.preventTouchTap) {
        return false;
      }

      var _props = this.props,
          trackingFunction = _props.onTouchTap,
          trackingTimeout = _props.trackingTimeout;

      // try to track the click but with the timeout
      // in case of tracking-blocking browser extensions or failure to load analytics scripts

      return Promise.race([trackingFunction(), this.resolveByTimeout(trackingTimeout)]).then(this.navigateToUrl(event));
    }
  }, {
    key: 'addEvents',
    value: function addEvents() {
      global.window.addEventListener('contextmenu', this.onContextMenu);
      this.linkEl.addEventListener('touchstart', this.onTouchStart);
      this.linkEl.addEventListener('touchend', this.onTouchEnd);
    }
  }, {
    key: 'removeEvents',
    value: function removeEvents() {
      global.window.removeEventListener('contextmenu', this.onContextMenu);
      this.linkEl.removeEventListener('touchstart', this.onTouchStart);
      this.linkEl.removeEventListener('touchend', this.onTouchEnd);
    }
  }, {
    key: 'navigateToUrl',
    value: function navigateToUrl(event) {
      var _this4 = this;

      return function () {
        var _props2 = _this4.props,
            href = _props2.href,
            targetBlank = _props2.targetBlank,
            preventDefault = _props2.preventDefault;


        var ctrlKeyPressed = event.metaKey || event.ctrlKey;

        if (href && !preventDefault) {
          if (targetBlank || ctrlKeyPressed) {
            global.window.open(href, '_blank');
          } else {
            global.location.href = href;
          }
        }
      };
    }
  }, {
    key: 'preventDefault',
    value: function preventDefault(event) {
      event.preventDefault();
    }
  }, {
    key: 'resolveByTimeout',
    value: function resolveByTimeout(timeout) {
      return new Promise(function (resolve) {
        global.setTimeout(resolve, timeout);
      });
    }
  }, {
    key: 'render',
    value: function render() {
      var _this5 = this;

      var _props3 = this.props,
          children = _props3.children,
          href = _props3.href,
          addtionalClassName = _props3.className,
          trackingFunction = _props3.onTouchTap;


      var className = (0, _classnames2.default)('TrackingLink', _defineProperty({}, addtionalClassName, !!addtionalClassName));
      var onTouchTap = trackingFunction ? this.onTouchTap : undefined;

      return _react2.default.createElement(
        'a',
        {
          className: className,
          href: href,
          onTouchTap: onTouchTap,
          onClick: this.preventDefault,
          ref: function ref(linkEl) {
            _this5.linkEl = linkEl;
          }
        },
        children
      );
    }
  }]);

  return TrackingLink;
}(_react.Component);

TrackingLink.propTypes = {
  children: _propTypes2.default.node.isRequired,
  href: _propTypes2.default.string.isRequired,
  className: _propTypes2.default.string,
  onTouchTap: _propTypes2.default.func,
  targetBlank: _propTypes2.default.bool,
  preventDefault: _propTypes2.default.bool,
  trackingTimeout: _propTypes2.default.number,
  contextMenuTimeout: _propTypes2.default.number
};
TrackingLink.defaultProps = {
  trackingTimeout: 500, // ms
  contextMenuTimeout: 300 // ms
};
exports.default = TrackingLink;