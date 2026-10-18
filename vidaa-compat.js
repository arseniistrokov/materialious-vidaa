/* AGPL-3.0: VIDAA Chromium 111 compatibility. Loaded before framework modules.
 * Promise.withResolvers is used by the upstream Shaka 5 player, but is absent in Chromium 111.
 * Preserve native implementations and Promise subclass constructors.
 */
(function () {
  'use strict';
  if (typeof Promise.withResolvers !== 'function') {
    Object.defineProperty(Promise, 'withResolvers', { configurable: true, writable: true, value: function () {
      var resolve, reject;
      var promise = new this(function (yes, no) { resolve = yes; reject = no; });
      return { promise: promise, resolve: resolve, reject: reject };
    }});
  }
}());
