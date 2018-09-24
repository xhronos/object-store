const should = require('chai').should();
const ObjectStore = require('../index.js').ObjectStore;

let _os;
let _ctr = 0;
function onCreate(id, obj) {
	_ctr++;
	if (obj == null) obj = {};
	if (typeof obj === 'object') {
		obj.id = id;
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
	});
});
