import React from 'react';
import test from 'ava';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import TrackingLink, { CONTEXT_MENU_TIMEOUT } from '../src';

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
});

test('renders children', t => {
  t.is(trackingLink.find('.tracked-button').length, 1);
});

test('componentDidMount() calls addGlobalEvents()', async t => {
  instance.addGlobalEvents = sinon.spy();

  instance.componentDidMount();

  t.true(instance.addGlobalEvents.calledOnce);
});

test('componentWillUnmount() calls removeGlobalEvents()', async t => {
  instance.removeGlobalEvents = sinon.spy();

  instance.componentWillUnmount();

  t.true(instance.removeGlobalEvents.calledOnce);
});

test.cb('onContextMenu() sets `preventTouchTap` state to true and sets timeout after which sets `preventTouchTap` state to true', t => {
  t.false(instance.state.preventTouchTap);

  instance.onContextMenu();

  t.true(instance.state.preventTouchTap);

  global.setTimeout(() => {
    t.false(instance.state.preventTouchTap);
    t.end();
  }, CONTEXT_MENU_TIMEOUT);
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

test('addGlobalEvents() adds event listener for `contextmenu`', t => {
  global.window = {
    addEventListener: sinon.spy(),
  };

  instance.addGlobalEvents();

  t.true(global.window.addEventListener.calledWith('contextmenu', instance.onContextMenu));
});

test('removeGlobalEvents() removes event listener for `contextmenu`', t => {
  global.window = {
    removeEventListener: sinon.spy(),
  };

  instance.removeGlobalEvents();

  t.true(global.window.removeEventListener.calledWith('contextmenu', instance.onContextMenu));
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
