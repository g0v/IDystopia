/*
 * Remember some key-value pairs locally and or remotely.
 *
 * 2. localStorage: use window.localStorage to store something across browser section.
 * 3. remoteStorage: use ??? to store data remotely.
 *
 * For (3), we will generate an 'datastore_token', which is saved in localStorage,
 * on remoteStorage, different datastore_token means a different identity.
 */

import StoreModule from 'store2';

function _hasOwnProperty(obj, property) {
  return Object.prototype.hasOwnProperty.call(obj, property);
}

(function(_) {
  const callbacks = [];

  _.fn('setAndNotify', function(key, value) {
    this.set(key, value);

    if (!this.callbacks) return;

    if (_hasOwnProperty(this.callbacks, key)) {
      for (const callback of this.callbacks[key]) {
        callback.call(this, key);
      }
    }

    if (_hasOwnProperty(this.callbacks, '*')) {
      for (const callback of this.callbacks['*']) {
        callback.call(this, key);
      }
    }
  });

  _.fn('notify', function() {
    for (const key in callbacks) {
      if (_hasOwnProperty(this.callbacks, key)) {
        for (const callback of this.callbacks[key]) {
          callback.call(this);
        }
      }
    }
  });

  _.fn('listen', function(key, callback) {
    if (this.callbacks === undefined) {
      this.callbacks = {};
    }

    if (this.callbacks[key] === undefined) {
      this.callbacks[key] = [];
    }

    this.callbacks[key].push(callback);
  });
})(StoreModule._);

export class LocalStorage {
  constructor() {
  }
}


export class RemoteStorage {

}

export const AnswerStore = StoreModule.namespace('DIALOG_ANSWER');
