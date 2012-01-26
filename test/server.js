var should = require('chai').should()
  , orchid = require('..');

describe('server', function () {

  it('should have a version', function () {
    orchid.version.should.match(/^\d+\.\d+\.\d+$/);
  });

  it('should be a wildcarded event emitter', function (done) {
    var serv = new orchid.Server()
      , c = 0;

    function after (d) {
      c++;
      d.should.equal(c);
      if (c == 2) done();
    };

    serv.on([ 'hello', '*' ], after);
    serv.emit('hello::universe', 1);
    serv.emit('hello::world', 2);
  });
});
