/*
 * Remember some key-value pairs locally and or remotely.
 *
 * 1. localStorage: use window.localStorage to store something across browser
 *    section.
 * 2. remoteStorage: use g0v backend to store data remotely.
 *
 * For (2), we will generate an 'datastore_token', which is saved in
 * localStorage, on remoteStorage, different datastore_token means a different
 * identity.
 */

import StoreModule from 'store2';
import {KEY_MAP, REV_KEY_MAP} from './remote_key_map.js';

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


const _DATASTORE_API_URL = 'https://pingtung-hao-305236.middle2.me/api';
const _REMOTE_STORE_CACHE = StoreModule.namespace('REMOTE_STORE_CACHE');

class RemoteStoreClass {
  constructor() {
    // have we checked our token in current session?
    this._tokenChecked = false;
  }

  get token() {
    return _REMOTE_STORE_CACHE.get('token');
  }

  async _register() {
    const response = await fetch(`${_DATASTORE_API_URL}/register`, {
      method: 'POST',
      // mode: 'no-cors',
    });
    const data = await response.json();
    if (data.token) {
      _REMOTE_STORE_CACHE.set('token', data.token);
      // expire in one day.
      const expireTime = (new Date()).getTime() + 86400 * 1000;
      _REMOTE_STORE_CACHE.set('expire', expireTime);
      this._tokenChecked = true;
    }
  }

  /*
   * Makes sure there is a valid token.
   */
  async _ensureToken() {
    if (!_REMOTE_STORE_CACHE.has('token')) {
      return await this._register();
    }

    const now = (new Date()).getTime();
    if (now > _REMOTE_STORE_CACHE.get('expire', 0)) {
      return await this._register();
    }

    // the token should not be expired yet, but let's check for sure.
    if (!this._tokenChecked) {
      const token = this.token;
      const response = 
        await fetch(`${_DATASTORE_API_URL}/check_token?token=${token}`, {
          method: 'GET',
          // mode: 'no-cors',
        });

      const data = await response.json();
      if (data.ok !== true)  {
        return await this._register();
      }

      this._tokenChecked = true;
    }
  }

  async _inc(key) {
    await this._ensureToken();

    console.log(`increasing key: ${key}`);
    // now this.token is available.
    const url = `${_DATASTORE_API_URL}/inc?token=${this.token}&key=${key}`;
    const response = await fetch(url, {
      method: 'POST',
      // mode: 'no-cors',
    });
    const data = await response.json();
    console.log(`increased key: ${key} -> ${data.value}, data: `, data);
    return data.value;
  }

  async _getc(key) {
    await this._ensureToken();

    // now this.token is available.
    const url = `${_DATASTORE_API_URL}/getc?token=${this.token}&key=${key}`;
    const response = await fetch(url, {
      method: 'GET',
      // mode: 'no-cors',
    });
    const data = await response.json();
    return data.value;
  }

  increase(key) {
    key = REV_KEY_MAP[key];
    return this._inc(key);
  }

  getCount(key) {
    key = REV_KEY_MAP[key];
    return this._getc(key);
  }

  async getAllCount() {
    const result = {};
    for (const key in KEY_MAP) {
      const localKey = KEY_MAP[key];
      const count = await this.getCount(localKey);
      result[localKey] = count;
    }
    return result;
  }
}

export const AnswerStore = StoreModule.namespace('DIALOG_ANSWER');
export const RemoteStore = new RemoteStoreClass();
