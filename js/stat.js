!function(t){var e={};function n(i){if(e[i])return e[i].exports;var s=e[i]={i:i,l:!1,exports:{}};return t[i].call(s.exports,s,s.exports,n),s.l=!0,s.exports}n.m=t,n.c=e,n.d=function(t,e,i){n.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:i})},n.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},n.t=function(t,e){if(1&e&&(t=n(t)),8&e)return t;if(4&e&&"object"==typeof t&&t&&t.__esModule)return t;var i=Object.create(null);if(n.r(i),Object.defineProperty(i,"default",{enumerable:!0,value:t}),2&e&&"string"!=typeof t)for(var s in t)n.d(i,s,function(e){return t[e]}.bind(null,s));return i},n.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return n.d(e,"a",e),e},n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},n.p="",n(n.s=2)}([function(t,e,n){"use strict";n.d(e,"a",(function(){return h})),n.d(e,"b",(function(){return f}));var i=n(1),s=n.n(i);const r={"0000000001":"MISSION/intro/step-1/done","0000000002":"MISSION/receive-package/step-1/done","0000000003":"RESPONSE/player_occupation/學生","0000000004":"RESPONSE/player_occupation/工程師","0000000005":"RESPONSE/player_occupation/律師","0000000006":"RESPONSE/player_occupation/健身教練","0000000007":"RESPONSE/player_occupation/中年職業婦女","0000000008":"RESPONSE/player_occupation/記者","0000000009":"MISSION/receive-package/step-2/done","0000000010":"MISSION/student-scene-intro/step-1/done","0000000011":"MISSION/student-scene-intro/step-2/done","0000000012":"MISSION/student-scene-intro/step-3/done","0000000013":"RESPONSE/student-intro-choice/passive","0000000014":"RESPONSE/student-intro-choice/proactive","0000000015":"MISSION/student-scene-academic-affairs-office/step-1/done","0000000016":"RESPONSE/student_asked_followup_question/false","0000000017":"RESPONSE/student_asked_followup_question/true","0000000018":"MISSION/student-scene-department-office/step-1/done","0000000019":"MISSION/student-scene-home-2/step-1/done","0000000020":"MISSION/student-scene-home-2/step-2/done","0000000021":"MISSION/student-scene-home-2/step-3/done","0000000022":"RESPONSE/student-gene-interested-in/gene","0000000023":"RESPONSE/student-gene-interested-in/system"},o={};for(const t in r)o[r[t]]=t;function a(t,e){return Object.prototype.hasOwnProperty.call(t,e)}!function(t){const e=[];t.fn("setAndNotify",(function(t,e){if(this.set(t,e),this.callbacks){if(a(this.callbacks,t))for(const e of this.callbacks[t])e.call(this,t);if(a(this.callbacks,"*"))for(const e of this.callbacks["*"])e.call(this,t)}})),t.fn("notify",(function(){for(const t in e)if(a(this.callbacks,t))for(const e of this.callbacks[t])e.call(this)})),t.fn("listen",(function(t,e){void 0===this.callbacks&&(this.callbacks={}),void 0===this.callbacks[t]&&(this.callbacks[t]=[]),this.callbacks[t].push(e)}))}(s.a._);const c="https://pingtung-hao-305236.middle2.me",u=s.a.namespace("REMOTE_STORE_CACHE");const h=s.a.namespace("DIALOG_ANSWER"),f=new class{constructor(){this._tokenChecked=!1}get token(){return u.get("token")}async _register(){const t=await fetch(c+"/register",{method:"POST"}),e=await t.json();if(e.token){u.set("token",e.token);const t=(new Date).getTime()+864e5;u.set("expire",t),this._tokenChecked=!0}}async _ensureToken(){if(!u.has("token"))return await this._register();if((new Date).getTime()>u.get("expire",0))return await this._register();if(!this._tokenChecked){const t=this.token,e=await fetch(`${c}/check_token?token=${t}`,{method:"GET"});if(!0!==(await e.json()).ok)return await this._register();this._tokenChecked=!0}}async _inc(t){await this._ensureToken(),console.log("increasing key: "+t);const e=`${c}/inc?token=${this.token}&key=${t}`,n=await fetch(e,{method:"POST"}),i=await n.json();return console.log(`increased key: ${t} -> ${i.value}, data: `,i),i.value}async _getc(t){await this._ensureToken();const e=`${c}/getc?token=${this.token}&key=${t}`,n=await fetch(e,{method:"GET"});return(await n.json()).value}increase(t){return t=o[t],this._inc(t)}getCount(t){return t=o[t],this._getc(t)}async getAllCount(){const t={};for(const e in r){const n=r[e],i=await this.getCount(n);t[n]=i}return t}}},function(t,e,n){var i,s,r,o;i=this,s=this&&this.define,r={version:"2.12.0",areas:{},apis:{},inherit:function(t,e){for(var n in t)e.hasOwnProperty(n)||Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n));return e},stringify:function(t){return void 0===t||"function"==typeof t?t+"":JSON.stringify(t)},parse:function(t,e){try{return JSON.parse(t,e||r.revive)}catch(e){return t}},fn:function(t,e){for(var n in r.storeAPI[t]=e,r.apis)r.apis[n][t]=e},get:function(t,e){return t.getItem(e)},set:function(t,e,n){t.setItem(e,n)},remove:function(t,e){t.removeItem(e)},key:function(t,e){return t.key(e)},length:function(t){return t.length},clear:function(t){t.clear()},Store:function(t,e,n){var i=r.inherit(r.storeAPI,(function(t,e,n){return 0===arguments.length?i.getAll():"function"==typeof e?i.transact(t,e,n):void 0!==e?i.set(t,e,n):"string"==typeof t||"number"==typeof t?i.get(t):"function"==typeof t?i.each(t):t?i.setAll(t,e):i.clear()}));i._id=t;try{e.setItem("__store2_test","ok"),i._area=e,e.removeItem("__store2_test")}catch(t){i._area=r.storage("fake")}return i._ns=n||"",r.areas[t]||(r.areas[t]=i._area),r.apis[i._ns+i._id]||(r.apis[i._ns+i._id]=i),i},storeAPI:{area:function(t,e){var n=this[t];return n&&n.area||(n=r.Store(t,e,this._ns),this[t]||(this[t]=n)),n},namespace:function(t,e){if(!t)return this._ns?this._ns.substring(0,this._ns.length-1):"";var n=t,i=this[n];if(!(i&&i.namespace||(i=r.Store(this._id,this._area,this._ns+n+"."),this[n]||(this[n]=i),e)))for(var s in r.areas)i.area(s,r.areas[s]);return i},isFake:function(){return"fake"===this._area.name},toString:function(){return"store"+(this._ns?"."+this.namespace():"")+"["+this._id+"]"},has:function(t){return this._area.has?this._area.has(this._in(t)):!!(this._in(t)in this._area)},size:function(){return this.keys().length},each:function(t,e){for(var n=0,i=r.length(this._area);n<i;n++){var s=this._out(r.key(this._area,n));if(void 0!==s&&!1===t.call(this,s,this.get(s),e))break;i>r.length(this._area)&&(i--,n--)}return e||this},keys:function(t){return this.each((function(t,e,n){n.push(t)}),t||[])},get:function(t,e){var n,i=r.get(this._area,this._in(t));return"function"==typeof e&&(n=e,e=null),null!==i?r.parse(i,n):null!=e?e:i},getAll:function(t){return this.each((function(t,e,n){n[t]=e}),t||{})},transact:function(t,e,n){var i=this.get(t,n),s=e(i);return this.set(t,void 0===s?i:s),this},set:function(t,e,n){var i=this.get(t);return null!=i&&!1===n?e:r.set(this._area,this._in(t),r.stringify(e),n)||i},setAll:function(t,e){var n,i;for(var s in t)i=t[s],this.set(s,i,e)!==i&&(n=!0);return n},add:function(t,e){var n=this.get(t);if(n instanceof Array)e=n.concat(e);else if(null!==n){var i=typeof n;if(i===typeof e&&"object"===i){for(var s in e)n[s]=e[s];e=n}else e=n+e}return r.set(this._area,this._in(t),r.stringify(e)),e},remove:function(t,e){var n=this.get(t,e);return r.remove(this._area,this._in(t)),n},clear:function(){return this._ns?this.each((function(t){r.remove(this._area,this._in(t))}),1):r.clear(this._area),this},clearAll:function(){var t=this._area;for(var e in r.areas)r.areas.hasOwnProperty(e)&&(this._area=r.areas[e],this.clear());return this._area=t,this},_in:function(t){return"string"!=typeof t&&(t=r.stringify(t)),this._ns?this._ns+t:t},_out:function(t){return this._ns?t&&0===t.indexOf(this._ns)?t.substring(this._ns.length):void 0:t}},storage:function(t){return r.inherit(r.storageAPI,{items:{},name:t})},storageAPI:{length:0,has:function(t){return this.items.hasOwnProperty(t)},key:function(t){var e=0;for(var n in this.items)if(this.has(n)&&t===e++)return n},setItem:function(t,e){this.has(t)||this.length++,this.items[t]=e},removeItem:function(t){this.has(t)&&(delete this.items[t],this.length--)},getItem:function(t){return this.has(t)?this.items[t]:null},clear:function(){for(var t in this.items)this.removeItem(t)}}},(o=r.Store("local",function(){try{return localStorage}catch(t){}}())).local=o,o._=r,o.area("session",function(){try{return sessionStorage}catch(t){}}()),o.area("page",r.storage("page")),"function"==typeof s&&void 0!==s.amd?s("store2",[],(function(){return o})):t.exports?t.exports=o:(i.store&&(r.conflict=i.store),i.store=o)},function(t,e,n){"use strict";n.r(e),n(0).b.getAllCount().then(t=>{document.getElementById("loading").hidden=!0;const e=document.getElementById("stat-table");for(const n in t){const i=t[n],s=e.insertRow();s.insertCell().innerHTML=n,s.insertCell().innerHTML=i}})}]);
//# sourceMappingURL=stat.js.map