!function(e,t){if("object"==typeof exports&&"object"==typeof module)module.exports=t();else if("function"==typeof define&&define.amd)define([],t);else{var r=t();for(var a in r)("object"==typeof exports?exports:e)[a]=r[a]}}(this,(()=>(()=>{"use strict";var e={d:(t,r)=>{for(var a in r)e.o(r,a)&&!e.o(t,a)&&Object.defineProperty(t,a,{enumerable:!0,get:r[a]})},o:(e,t)=>Object.prototype.hasOwnProperty.call(e,t),r:e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}},t={};e.r(t),e.d(t,{IDBDatabaseConnector:()=>n,IDBDatabaseTableConnector:()=>s});const r=require("uuid");function a(e){return new Promise(((t,r)=>{e.onsuccess=()=>t(e.result),e.onerror=()=>r(e.error)}))}async function*o(e,{limit:t=0,offset:r=0,where:o}){let n=0;const{operator:s,key:i,value:c}=o??{};if(r>0){if(await a(e),!e.result)return;e.result.advance(r)}for(;;){await a(e);const{result:r}=e;if(!r)break;if(t>0&&n>=t)break;i&&c&&("!="===s&&c===r.value[i]||"not-in"===s&&c.includes(r.value[i])||"in"===s&&!c.includes(r.value[i]))||(n+=1,yield r.value),r.continue()}}class n{dbKey;layout;db;constructor(e,t){this.dbKey=e,this.layout=t}async open(){return new Promise(((e,t)=>{const r=indexedDB.open(this.dbKey,this.layout.version);r.onupgradeneeded=e=>{const t=e.target,r=t.result,a=t.transaction;for(const e in this.layout.tables){const t=this.layout.tables[e],o=a?.objectStore(e);if(r.objectStoreNames.contains(e)){t.indexes?.forEach((e=>{o?.indexNames.contains(e.keyPath)||o?.createIndex(e.keyPath,e.keyPath)}));for(const e of Array.from(o?.indexNames??[]))t.indexes?.find((t=>t.keyPath===e))||o?.deleteIndex(e)}else{r.createObjectStore(e,{keyPath:"id"}),t.indexes?.forEach((e=>{o?.createIndex(e.keyPath,e.keyPath)}));for(const e in r.objectStoreNames)this.layout.tables[e]||r.deleteObjectStore(e)}}},r.onsuccess=()=>{this.db=r.result,e()},r.onerror=e=>{t(e)}}))}close(){this.db?.close()}hasTable(e){if(!this.db)throw new Error("Database not open");return this.db.objectStoreNames.contains(e)??!1}createTable(e){if(!this.db)throw new Error("Database not open");if(this.hasTable(e))throw new Error(`Table ${e} already exists`);this.db.createObjectStore(e,{keyPath:"id"})}getTableConnector(e){if(!this.db)throw new Error("Database not open");if(!this.hasTable(e))throw new Error(`Table '${e}' does not exist`);return new s(this.db,e)}}class s{db;tableName;constructor(e,t){this.db=e,this.tableName=t}async get(e){const t=this.db.transaction(this.tableName,"readonly").objectStore(this.tableName);return await a(t.get(e))}async set(e,t){const r=this.db.transaction(this.tableName,"readwrite").objectStore(this.tableName),o={...t,id:e};return await a(r.put(o)),o}async add(e){const t=this.db.transaction(this.tableName,"readwrite").objectStore(this.tableName),o={...e,id:(0,r.v4)()};return await a(t.add(o)),o}async delete(e){const t=this.db.transaction(this.tableName,"readwrite").objectStore(this.tableName);await a(t.delete(e))}async clear(){const e=this.db.transaction(this.tableName,"readwrite").objectStore(this.tableName);await a(e.clear())}async list(e){try{const t=this.db.transaction(this.tableName,"readonly").objectStore(this.tableName);let r=null;const a="asc"===e?.orderBy?.direction?"next":"desc"===e?.orderBy?.direction?"prev":void 0;if(e)if(e.where){const o=this.getIndexFromWhereQuery(t,e),n=this.getKeyRange(e.where);r=o.openCursor(n,a)}else e.orderBy?.key&&(r=this.getIndexFromStore(t,e.orderBy.key).openCursor(null,a));r||(r=t.openCursor());const n=[];for await(const t of o(r,e??{}))n.push(t);return n}catch(e){throw new Error("Invalid query")}}async count(e){const t=this.db.transaction(this.tableName,"readonly").objectStore(this.tableName);if(!e?.where)return await a(t.count());const r=this.getIndexFromWhereQuery(t,e),o=this.getKeyRange(e.where);if("!="!==e.where.operator&&"in"!==e.where.operator&&"not-in"!==e.where.operator)return await a(r.count(o));const n=await this.getComplementaryCount(r,e.where);return"in"===e.where.operator?n:await a(t.count())-n}async calculateSize(){const e=this.db.transaction(this.tableName,"readonly").objectStore(this.tableName).openCursor();let t=0;for await(const r of o(e,{}))t+=new Blob([JSON.stringify(r)]).size;return t}getKeyRange(e){if(!e?.operator||!e?.value)throw new Error("Invalid query: where clause must have an operator and a value");const{operator:t,value:r}=e;switch(t){case"==":return IDBKeyRange.only(r);case">":case">=":return IDBKeyRange.lowerBound(r,">"===t);case"<":case"<=":return IDBKeyRange.upperBound(r,"<"===t);case"between":return IDBKeyRange.bound(r[0],r[1]);case"!=":case"not-in":case"in":return;default:throw new Error(`Invalid query: invalid operator: ${t}`)}}getIndexFromWhereQuery(e,t){if(!t.where?.key)throw new Error("Invalid query: where clause must have a key");return e.keyPath===t.where.key?e:this.getIndexFromStore(e,t.where.key)}getIndexFromStore(e,t){try{return e.index(t)}catch(e){throw new Error("Index not found")}}async getComplementaryCount(e,t){const r={...t},o=Array.isArray(t.value)?t.value:[t.value];r.operator="==";let n=0;for(const t of o){r.value=t;const o=this.getKeyRange(r);n+=await a(e.count(o))}return n}}return t})()));