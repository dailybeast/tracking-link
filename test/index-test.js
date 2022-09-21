import React from 'react';
import test from 'ava';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import TrackingLink from '../src';

const CLASSNAME = 'test-class';
const URL = 'something.org/path';

const onClickStub = sinon.stub().returns(Promise.resolve());

let trackingLink;
let instance;

test.beforeEach(() => {
  trackingLink = shallow(
    <TrackingLink
      className={CLASSNAME}
      href={URL}
      onClick={onClickStub}
      targetBlank={false}
      preventDefault={false}
      trackingTimeout={0}
      contextMenuTimeout={0}
    >
      <button className="tracked-button" />
    </TrackingLink>,
    { disableLifecycleMethods: true }
  );
  instance = trackingLink.instance();
});

test('renders link element with className=`TrackingLink`', t => {
  t.is(trackingLink.type(), 'a');
  t.true(trackingLink.hasClass('TrackingLink'));
  t.true(trackingLink.hasClass(CLASSNAME));
  t.is(trackingLink.prop('href'), URL);
  t.is(trackingLink.prop('onClick').toString(), instance.onClick.toString());

  t.is(typeof trackingLink.getElement().ref, 'function');

  const linkEl = 'linkEl';
  trackingLink.getElement().ref(linkEl);

  t.is(instance.linkEl, linkEl);
});

test('renders children', t => {
  t.is(trackingLink.find('.tracked-button').length, 1);
});

test.serial('onClick() calls `onClick` prop and then calls navigateToUrl() with nativeEvent', async t => {
  global.navigator = { userAgent: 'Safari' };
  
  const navigateToUrlSpy = sinon.spy();
  const preventDefaultSpy = sinon.spy();
  instance.navigateToUrl = sinon.stub().returns(navigateToUrlSpy);

  const eventMock = {
    preventDefault: preventDefaultSpy,
    nativeEvent: {
      button: 1,
    }
  };

  await instance.onClick(eventMock);

  t.true(onClickStub.calledOnce);
  t.true(onClickStub.calledWith(eventMock));
  t.true(instance.navigateToUrl.calledWith(eventMock.nativeEvent));
  t.true(preventDefaultSpy.calledOnce);
  t.true(navigateToUrlSpy.calledOnce);
});

test('navigateToUrl() redirects the page to the new url if there is `href` prop', t => {
  global.location = { href: 'old-url.com' };
  global.navigator = { userAgent: 'Safari' };
  global.window = { open: sinon.spy() };

  instance.navigateToUrl({})();

  t.is(global.location.href, URL);
  t.false(global.window.open.called);
});

test('navigateToUrl() opens new window if there is `href` and `targetBlank` prop', t => {
  global.location = { href: 'old-url.com' };
  global.navigator = { userAgent: 'Safari' };
  global.window = { open: sinon.spy() };

  trackingLink.setProps({ targetBlank: true });
  instance.navigateToUrl({})();

  t.is(global.location.href, 'old-url.com');
  t.true(global.window.open.calledWith(URL, '_blank'));
});

test('navigateToUrl() opens new window if there is `href` and ctrl key is pressed', t => {
  global.location = { href: 'old-url.com' };
  global.navigator = { userAgent: 'Safari' };
  global.window = { open: sinon.spy() };

  instance.navigateToUrl({ ctrlKey: true })();

  t.is(global.location.href, 'old-url.com');
  t.true(global.window.open.calledWith(URL, '_blank'));
});

test('navigateToUrl() opens new window if there is `href` and meta key is pressed', t => {
  global.location = { href: 'old-url.com' };
  global.navigator = { userAgent: 'Safari' };
  global.window = { open: sinon.spy() };

  instance.navigateToUrl({ metaKey: true })();

  t.is(global.location.href, 'old-url.com');
  t.true(global.window.open.calledWith(URL, '_blank'));
});

test('navigateToUrl() opens new window if isMouseWheelClick() returns true and isChrome() returns false', t => {
  global.location = { href: 'old-url.com' };
  global.navigator = { userAgent: 'Safari' };
  global.window = { open: sinon.spy() };
  instance.isMouseWheelClick = () => true;
  instance.isChrome = () => false;

  instance.navigateToUrl({})();

  t.is(global.location.href, 'old-url.com');
  t.true(global.window.open.calledWith(URL, '_blank'));
});

test('navigateToUrl() does nothing if there is `preventDefault` prop', t => {
  global.location = { href: 'old-url.com' };
  global.navigator = { userAgent: 'Safari' };
  global.window = { open: sinon.spy() };

  trackingLink.setProps({ preventDefault: true });
  instance.navigateToUrl({})();

  t.is(global.location.href, 'old-url.com');
  t.false(global.window.open.called);
});

test('navigateToUrl() does nothing if there is no `href` prop', t => {
  global.location = { href: 'old-url.com' };
  global.navigator = { userAgent: 'Safari' };
  global.window = { open: sinon.spy() };

  trackingLink.setProps({ href: undefined });
  instance.navigateToUrl({})();

  t.is(global.location.href, 'old-url.com');
  t.false(global.window.open.called);
});

test('navigateToUrl() returns false when isMouseWheelClick() and isChrome() both return true', t => {
  instance.isMouseWheelClick = () => true;
  instance.isChrome = () => true;

  t.false(instance.navigateToUrl({})());
});

test('resolveByTimeout() returns Promise that resolves by timeout', async t => {
  await instance.resolveByTimeout(0);

  t.pass();
});

test('isMouseWheelClick() returns true only when `event.which`=2 or `event.button`=1', t => {
  t.false(instance.isMouseWheelClick({}));
  t.false(instance.isMouseWheelClick({ which: 1 }));
  t.true(instance.isMouseWheelClick({ which: 2 }));
  t.false(instance.isMouseWheelClick({ button: 2 }));
  t.true(instance.isMouseWheelClick({ button: 1 }));
});

test('isChrome() returns true only when userAgent contains string `Chrome`', t => {
  global.navigator = { userAgent: 'NetScape 6' };
  t.false(instance.isChrome());

  global.navigator = { userAgent: 'Mozilla 2, Gecko 3' };
  t.false(instance.isChrome());

  global.navigator = { userAgent: 'Mozilla 2, Chrome 45' };
  t.true(instance.isChrome());
});
