var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var {join} = require('path')

chai.use(chaiAsPromised);

global.requireRoot = (path)=> {
  return require(join(__dirname, '..', path));
}

global.should = chai.should()