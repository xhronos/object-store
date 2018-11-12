const should = require('chai').should();
const ObjectStore = require('../index.js').ObjectStore;

let _os;
let _ctr = 0;
let _someProperty = 'Ä\'/"ß"';

function onCreate(id, obj) {
	_ctr++;
	if (obj == null) obj = {};
	if (typeof obj === 'object') {
		obj.id = id;
		obj[_someProperty] = 42;
	}
	return obj;
}

describe('ObjectStore access',()=>{
	it('should create ObjectStore', () => {
		_os = new ObjectStore({onCreate});
	});
	it('should create an object', async () => {
		let oldCtr = _ctr;
		const id = await _os.create();
		_ctr.should.equal(oldCtr+1);

		should.exist(id);
		id.should.equal('1');
	});
	it('should create another object', async () => {
		let oldCtr = _ctr;
		const id = await _os.create();
		_ctr.should.equal(oldCtr+1);

		should.exist(id);
		id.should.equal('2');
	});
	it('should get created objects', async () => {
		const obj1 = await _os.get(1);
		const obj2 = await _os.get('2');

		should.exist(obj1);
		should.exist(obj2);

		obj1.should.have.property('id').equal('1');
		obj2.should.have.property('id').equal('2');

		obj1.should.have.property(_someProperty).equal(42);
		obj2.should.have.property(_someProperty).equal(42);
	});
	it('should update objects', async () => {
		const obj1 = await _os.update(`1/${encodeURIComponent(_someProperty)}`, 123);
		const obj2 = await _os.update(['2',_someProperty], 456);

		should.exist(obj1);
		should.exist(obj2);

		obj1.should.have.property(_someProperty).equal(123);
		obj2.should.have.property(_someProperty).equal(456);
	});
	it('should delete object part', async () => {
		const obj1 = await _os.delete(`1/${encodeURIComponent(_someProperty)}`);

		should.exist(obj1);
		obj1.should.not.have.property(_someProperty);

		const obj = await _os.get('1');
		should.exist(obj);
		obj.should.not.have.property(_someProperty);
	});
	it('should delete whole object', async () => {
		const result = await _os.delete(`1`);

		should.not.exist(result);

		let obj;
		try {
			obj = await _os.get('1');
		}
		catch(e){
			should.exist(e);
		}
		should.not.exist(obj);
	});
});
