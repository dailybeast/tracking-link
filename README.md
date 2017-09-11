TrackingLink
=======

[![npm Version](https://img.shields.io/npm/v/enzyme.svg)](https://www.npmjs.com/package/enzyme) [![License](https://img.shields.io/npm/l/enzyme.svg)](https://www.npmjs.com/package/enzyme) [![Build Status](https://travis-ci.org/airbnb/enzyme.svg)](https://travis-ci.org/airbnb/enzyme)

TrackingLink is React component that helps to track clicks for links on the page.

### Features
* Supports ctrl/cmd + click to open url in a new tab/window
* Navigates to the URL when tracking function is resolved or when the timeout is resolved first (this helps to avoid problems with analytics-blocking browser extensions or when your tracking function has failed)
* Fixes the issue with the context menu in Firefox and mobile Chrome, when the right click (or long click on mobile) upon the link triggers click event

### Installation

```bash
npm i --save tracking-link
```

### Dependencies
TrackingLink uses onTouchTap event, so it is necessary for you to inject [react-tap-event-plugin](https://github.com/zilverline/react-tap-event-plugin) on your page, if you already don't use.
```bash
npm i --save react-tap-event-plugin
```

```javascript
import injectTapEventPlugin from 'react-tap-event-plugin';

injectTapEventPlugin();
```

### Usage
For example you have an image wrapped into 'a' tag and want to track clicks onto that link and then navigate a user to the url specified in href.

```javascript
import TrackingLink from 'tracking-link';
import { trackImageClick } from './analytics/image';

function SomeComponent() {
  return (
    <TrackingLink
      href="/image/cat.jpg"
      onTouchTap={trackImageClick}
    >
      <img src="cat.jpg" />
    </TrackingLink>
  );
}
```

Now when you click the image, TrackingLink will call your tracking function and when it resolves (or when timeout is resolved first) it will navigate user to the URL specified in the 'href' prop.

### Available props
 
```javascript
propTypes = {
  children: PropTypes.node.isRequired,
  // href - url where navigate when tracking function is resolved
  href: PropTypes.string.isRequired,
  // className is applied to the <a> tag
  className: PropTypes.string,
  // tracking function must be a Promise instance
  onTouchTap: PropTypes.func,
  // opens link in a new tab/window (default = false)
  targetBlank: PropTypes.bool,
  // don't navigate to the url (default = false)
  preventDefault: PropTypes.bool,
};
```