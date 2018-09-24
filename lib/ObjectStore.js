//let logEnabled = true
function log(){
	if (logEnabled) console.log.apply(console, arguments);
}

class ObjStoreError extends Error {}

/**
* @class ObjectStore manages JSON objects
*/
class ObjectStore {

	/**
	* @constructor
	* @param {onCreate} opt.onCreate async function returning created object
	* @param {onUpdate} opt.onUpdate async function returning updated object
	* @param {onDelete} opt.onDelete async function returning true if delete is allowed
	* @param {IdProvider} opt.idProvider object for createing IDs
	*/
	constructor(opt={}) {
		this.store = new Map(); // string -> obj
		this.onCreate = opt.onCreate || defaultOnCreate;
		this.onUpdate = opt.onUpdate || defaultOnUpdate;
		this.onDelete = opt.onDelete || defaultOnDelete;
		this.idProvider = opt.idProvider || new DefaultIdProvider();
	}

	async create(obj) {
		const id = await this.idProvider.allocate();
		obj = await this.onCreate(id, obj);
		this.store.set(id, obj);
		return id;
	}

	async get(path=[]) {
		path = splitPath(path);
		if (!path || !path.length) throw new ObjStoreError(`get needs a path`);
		const id = ""+path[0];
		if (!this.store.has(id)) {
			throw new ObjStoreError(`Object ${id} does not exist`);
		}
		const obj = this.store.get(id);
		if (path.length === 1) return obj;
		return accessSubObj(id, obj, path, 1);
	}
}

function splitPath(path) {
	if (Array.isArray(path)) return path;
	if (typeof path !== 'string') path = ""+path;
	path = path.split('/').map(decodeURIComponent);
	return path;
}

function joinPath(path) {
	if (typeof path !== 'string' && path.join) path = path.map(encodeURIComponent).join('/');
	return path;
}

/**
* accesses a sub-object of an object
* @param {Object} obj the object to get a subpath from
* @param {Object} opt options
* @param {String} opt.id id of object to show in errors
* @param {StringArray} opt.path  path array to use
* @param {Integer} opt.offset offset in path
*/
function accessSubObj(obj, opt) {
	const { id, path, offset } = opt;
	for (let i = offset; i < path.length; ++i) {
		const p = path[i];
		if (typeof obj !== 'object') {
			throw new ObjStoreError(`Path does not exist for object ${id}: ${JSON.stringify(path)}` );
		}
		if (!obj.hasOwnProperty(p)) {
			throw new ObjStoreError(`Invalid path for object ${id}: ${JSON.stringify(path)}` );
		}
		obj = obj[p];
	}
	if (obj === undefined) throw new ObjStoreError(`No property at path for object ${id}: ${JSON.stringify(path)}`);
	return obj;
}

/**
* default impl for onCreate
* @param {String} id
* @param {Any} obj the object (or any value) from the create request
* @return {Any} the modified obj
*/
async function defaultOnCreate(id, obj) {
	log(`[onCreate] ${id}`,obj);
	return obj;
}

/**
* default impl for onUpdate
* @param {String} id
* @param {Any} obj the object (or any value) which is in the store at given id
* @param {Any} the modified obj
* @param {StringArray} the path within the object, where to set val
*/
async function defaultOnUpdate(id, obj, path, val) {
	log(`[onUpdate] ${id} ${path.join(',')}`, val);
	return setValueAtPath(obj, { id, path, val });
}

/**
* default impl for onDelete
* If the length of the path is empty then the object is being deleted.
* @param {String} id
* @param {Any} obj the object (or any value) which is in the store at given id
* @param {StringArray} the path within the object, where to delete
* @return {Any} modified object
*/
async function defaultOnDelete(id, obj, path) {
	log(`[onDelete] ${id} ${path.join(',')}`);
	return deleteAtPath(obj, { id, path });
}

/**
* @class DefaultIdProvider
* Default implementation of an IdProvider.
*/
class DefaultIdProvider {
	constructor() {
		let next = 1;
		this.allocate = async () => "" + next++;
		this.free = async ()=>{}
	}
}

function setValueAtPath(obj, opt) {
	const { id, path, val } = opt;
	if (!path.length) return val;
	if (typeof obj !== 'object') obj = {};
	const updated = obj;
	for (let i = 0; i < path.length-1; ++i) {
		const p = path[i];
		const o = obj[p];
		if (typeof o !== 'object') {
			o = {};
			obj[p] = o;
		}
		obj = o;
	}
	const key = path[path.length-1];
	obj[key] = val;
	return updated;
}

function deleteAtPath(obj, opt) {
	const { id, path } = opt;
	if (!path.length) return;
	if (typeof obj !== 'object') {
		throw new ObjStoreError(`Invalid delete-path for object ${id}: ${JSON.stringify(path)}` );
	}
	const updated = obj;
	for (let i = 0; i < path.length-1; ++i) {
		const p = path[i];
		const o = obj[p];
		if (o === undefined) return updated;
		if (typeof o !== 'object') {
			throw new ObjStoreError(`Invalid delete-path for object ${id}: ${JSON.stringify(path)}` );
		}
		obj = o;
	}
	const key = path[path.length-1];
	delete obj[key];
	return updated;
}

module.exports = ObjectStore;
