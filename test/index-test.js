import React from 'react';
import test from 'ava';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import TrackingLink, { MOUSE_RIGHT_BUTTON } from '../src';

const CLASSNAME = 'test-class';
const URL = 'something.org/path';

const onTouchTapStub = sinon.stub().returns(Promise.resolve());

let trackingLink;
let instance;

test.beforeEach(() => {
  trackingLink = shallow(
    <TrackingLink
      className={CLASSNAME}
      href={URL}
      onTouchTap={onTouchTapStub}
      targetBlank={false}
      preventDefault={false}
      trackingTimeout={0}
      contextMenuTimeout={0}
    >
      <button className="tracked-button" />
    </TrackingLink>
  );
  instance = trackingLink.instance();
});

test('renders link element with className=`TrackingLink`', t => {
  t.is(trackingLink.type(), 'a');
  t.true(trackingLink.hasClass('TrackingLink'));
  t.true(trackingLink.hasClass(CLASSNAME));
  t.is(trackingLink.prop('href'), URL);
  t.is(trackingLink.prop('onTouchTap').toString(), instance.onTouchTap.toString());
  t.is(trackingLink.prop('onClick').toString(), instance.preventDefault.toString());

  trackingLink.setProps({ onTouchTap: undefined });
  t.is(trackingLink.prop('onTouchTap'), undefined);

  t.is(typeof trackingLink.node.ref, 'function');

  const linkEl = 'linkEl';
  trackingLink.node.ref(linkEl);

  t.is(instance.linkEl, linkEl);
});

test('renders children', t => {
  t.is(trackingLink.find('.tracked-button').length, 1);
});

test('componentDidMount() calls addEvents()', async t => {
  instance.addEvents = sinon.spy();

  instance.componentDidMount();

  t.true(instance.addEvents.calledOnce);
});

test('componentWillUnmount() calls removeEvents()', async t => {
  instance.removeEvents = sinon.spy();

  instance.componentWillUnmount();

  t.true(instance.removeEvents.calledOnce);
});

test.cb('onContextMenu() sets `preventTouchTap` state to true and sets timeout after which sets `preventTouchTap` state to false', t => {
  t.false(instance.state.preventTouchTap);

  instance.onContextMenu();

  t.true(instance.state.preventTouchTap);

  global.setTimeout(() => {
    t.false(instance.state.preventTouchTap);
    t.end();
  }, 0);
});

test.serial('onLongTouch() sets `preventTouchTap` state to true', t => {
  instance.setState({ preventTouchTap: false });

  instance.onLongTouch();

  t.true(instance.state.preventTouchTap);
});

test.serial('onTouchStart() starts timer and assigns its id to the `longTouchTimer` instance variable', t => {
  instance.longTouchTimer = 0;

  instance.onTouchStart();

  t.true(instance.longTouchTimer !== 0);

  global.clearTimeout(instance.longTouchTimer);
});

test.cb('onTouchEnd() sets timeout after which sets `preventTouchTap` state to false', t => {
  instance.setState({ preventTouchTap: true });

  instance.onContextMenu();

  global.setTimeout(() => {
    t.false(instance.state.preventTouchTap);
    t.end();
  }, 0);
});

test.serial('onTouchTap() calls `onTouchTap` prop and then calls navigateToUrl() with nativeEvent', async t => {
  const navigateToUrlSpy = sinon.spy();
  instance.navigateToUrl = sinon.stub().returns(navigateToUrlSpy);

  const eventMock = {
    nativeEvent: {
      button: 1,
    }
  };

  await instance.onTouchTap(eventMock);

  t.true(onTouchTapStub.calledOnce);
  t.true(instance.navigateToUrl.calledWith(eventMock.nativeEvent));
  t.true(navigateToUrlSpy.calledOnce);
});

test.serial('onTouchTap() does not call navigateToUrl() when `preventTouchTap` is true', async t => {
  instance.setState({ preventTouchTap: true });
  instance.navigateToUrl = sinon.spy();

  await instance.onTouchTap({ nativeEvent: {} });

  t.false(instance.navigateToUrl.calledOnce);
});

test.serial('onTouchTap() does not call navigateToUrl() when it is a right click', async t => {
  instance.setState({ preventTouchTap: false });
  instance.navigateToUrl = sinon.spy();

  await instance.onTouchTap({ nativeEvent: { button: MOUSE_RIGHT_BUTTON } });

  t.false(instance.navigateToUrl.calledOnce);
});

test('addEvents() adds event listener for `contextmenu` and touch events for the link element', t => {
  global.window = {
    addEventListener: sinon.spy(),
  };
  instance.linkEl = {
    addEventListener: sinon.spy(),
  };

  instance.addEvents();

  t.true(global.window.addEventListener.calledWith('contextmenu', instance.onContextMenu));
  t.true(instance.linkEl.addEventListener.calledWith('touchstart', instance.onTouchStart));
  t.true(instance.linkEl.addEventListener.calledWith('touchend', instance.onTouchEnd));
});

test('removeEvents() removes event listener for `contextmenu` and touch events for the link element', t => {
  global.window = {
    removeEventListener: sinon.spy(),
  };
  instance.linkEl = {
    removeEventListener: sinon.spy(),
  };

  instance.removeEvents();

  t.true(global.window.removeEventListener.calledWith('contextmenu', instance.onContextMenu));
  t.true(instance.linkEl.removeEventListener.calledWith('touchstart', instance.onTouchStart));
  t.true(instance.linkEl.removeEventListener.calledWith('touchend', instance.onTouchEnd));
});

test('navigateToUrl() redirects the page to the new url if there is `href` prop', t => {
  global.location = { href: 'old-url.com' };
  global.window = { open: sinon.spy() };

  instance.navigateToUrl({})();

  t.is(global.location.href, URL);
  t.false(global.window.open.called);
});

test('navigateToUrl() opens new window if there is `href` and `targetBlank` prop', t => {
  global.location = { href: 'old-url.com' };
  global.window = { open: sinon.spy() };

  trackingLink.setProps({ targetBlank: true });
  instance.navigateToUrl({})();

  t.is(global.location.href, 'old-url.com');
  t.true(global.window.open.calledWith(URL, '_blank'));
});

test('navigateToUrl() opens new window if there is `href` and ctrl key is pressed', t => {
  global.location = { href: 'old-url.com' };
  global.window = { open: sinon.spy() };

  instance.navigateToUrl({ ctrlKey: true })();

  t.is(global.location.href, 'old-url.com');
  t.true(global.window.open.calledWith(URL, '_blank'));
});

test('navigateToUrl() opens new window if there is `href` and meta key is pressed', t => {
  global.location = { href: 'old-url.com' };
  global.window = { open: sinon.spy() };

  instance.navigateToUrl({ metaKey: true })();

  t.is(global.location.href, 'old-url.com');
  t.true(global.window.open.calledWith(URL, '_blank'));
});

test('navigateToUrl() does nothing if there is `preventDefault` prop', t => {
  global.location = { href: 'old-url.com' };
  global.window = { open: sinon.spy() };

  trackingLink.setProps({ preventDefault: true });
  instance.navigateToUrl({})();

  t.is(global.location.href, 'old-url.com');
  t.false(global.window.open.called);
});

test('navigateToUrl() does nothing if there is no `href` prop', t => {
  global.location = { href: 'old-url.com' };
  global.window = { open: sinon.spy() };

  trackingLink.setProps({ href: undefined });
  instance.navigateToUrl({})();

  t.is(global.location.href, 'old-url.com');
  t.false(global.window.open.called);
});

test('preventDefault() calls `preventDefault` function for the event it receives', t => {
  const eventMock = { preventDefault: sinon.spy() };

  instance.preventDefault(eventMock);

  t.true(eventMock.preventDefault.calledOnce);
});

test('resolveByTimeout() returns Promise that resolves by timeout', async t => {
  await instance.resolveByTimeout(0);

  t.pass();
});
