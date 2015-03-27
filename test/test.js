'use strict';


var fs = require('fs');
var should = require('should');
var matter = require(__dirname + '/..');
var fixtures = __dirname + '/fixtures/';

var normalCheck = function (obj, fromFile) {
  should(obj).be.ok;
  obj.should.have.ownProperty('src');
  obj.should.have.ownProperty('body');
  obj.should.have.ownProperty('data');
  should(obj.src).be.String;
  should(obj.body).be.String;
  should(obj.src.length >= obj.body.length).be.true;
  if (fromFile) {
    obj.should.have.ownProperty('path');
    should(obj.path).be.String;
    (function () {
      var stat = fs.statSync(obj.path);
      stat.isFile().should.be.true;
    }).should.not.throw();
  }
};

var checkFooBarBaz = function (obj, foo, bar, baz) {
  normalCheck(obj);
  obj.body.should.equal(baz);
  obj.data.should.have.ownProperty(foo);
  obj.data.should.have.keys(foo);  // only
  should(obj.data.foo).equal(bar);
};


describe('matter', function () {
  it('matter.parsers should expose builtin parsers', function () {
    matter.should.have.ownProperty('parsers');
    should(matter.parsers).be.Object;
    matter.parsers.should.have.ownProperty('yaml');
    matter.parsers.should.have.ownProperty('toml');
    should(matter.parsers.yaml).be.Function;
    should(matter.parsers.toml).be.Function;
  });
  it('matter.modules should expose required modules', function () {
    matter.should.have.ownProperty('modules');
    should(matter.modules).be.Object;
    matter.modules.should.have.ownProperty('yaml');
    matter.modules.should.have.ownProperty('toml');
    should(matter.modules.yaml).be.ok;
    should(matter.modules.toml).be.ok;
  });
});


describe('matter(string, options)', function () {

  describe('format of string', function () {
    it('should throw an error if the 1st argument is not a string', function () {
      (function () {
        matter();
      }).should.throw(Error);
    });
    it('should throw an error if the parser is not found', function () {
      (function () {
        matter('---nothing\nfoo: bar\n---');
      }).should.throw(Error);
    });
    it('builtin YAML parser should return null for invalid front matter', function () {
      (function () {
        var res = matter('---\n!!\n---');
        normalCheck(res);
        should(res.data).be.null;
      }).should.not.throw();
    });
    it('builtin TOML parser should return null for invalid front matter', function () {
      (function () {
        var res = matter('---toml\n!!\n---');
        normalCheck(res);
        should(res.data).be.null;
      }).should.not.throw();
    });
  });

  describe('format of options', function () {
    it('options.lang should be a string if provided', function () {
      (function () {
        matter('foobar', {lang: false});
      }).should.throw(Error);
    });
    it('options.delims should be a string or an array of strings if provided #1', function () {
      (function () {
        matter('foobar', {delims: false});
      }).should.throw(Error);
    });
    it('options.delims should be a string or an array of strings if provided #2', function () {
      (function () {
        matter('foobar', {delims: [false, null]});
      }).should.throw(Error);
    });
    it('options.delims should be a string or an array of strings if provided #3', function () {
      (function () {
        matter('foobar', {delims: [null, false]});
      }).should.throw(Error);
    });
    it('options.parsers should be a function or dictionary of function #4', function () {
      (function () {
        matter('---\nfoo: bar\n---', {parsers: {yaml: true}});
      }).should.throw(Error);
    });
  });

  describe('matter(string, _)', function () {
    it('should accept an empty string', function () {
      var res = matter('');
      normalCheck(res);
      res.src.should.equal('');
      res.body.should.equal('');
      should(res.data).be.null;
    });
    [ '---\n ---'
    , '---\n'
    , '\n---'
    , '----\n---'  // acceptable when options.loose is true
    , '---\n----'  // acceptable when options.loose is true
    ].forEach(function (s, i) {
      it('should accept an string without front matter #' + (i + 1), function () {
        var res = matter(s);
        normalCheck(res);
        res.src.should.equal(s);
        res.body.should.equal(s);
        should(res.data).be.null;
      });
    });
    it('should extract the YAML front matter from the string', function () {
      var res = matter('---\nfoo: bar\n---\n\nbaz');
      checkFooBarBaz(res, 'foo', 'bar', '\nbaz');
    });
    it('should extract the YAML front matter from the string with BOM', function () {
      var res = matter('\uFEFF---\nfoo: bar\n---\n\nbaz');
      checkFooBarBaz(res, 'foo', 'bar', '\nbaz');
    });
    it('should extract the TOML front matter from the string', function () {
      var res = matter('--- toml \nfoo = "bar"\n---\n\nbaz');
      checkFooBarBaz(res, 'foo', 'bar', '\nbaz');
    });
    it('should extract the TOML front matter from the string with BOM', function () {
      var res = matter('\uFEFF--- toml \nfoo = "bar"\n---\n\nbaz');
      checkFooBarBaz(res, 'foo', 'bar', '\nbaz');
    });
  });

  describe('matter(_, {lang: ?})', function () {
    it('should choose a parser according to options.lang if options.parsers is not a function #1', function () {
      var res = matter('---\nfoo: bar\n---\nbaz', {lang: 'yaml'});
      checkFooBarBaz(res, 'foo', 'bar', 'baz');
    });
    it('should choose a parser according to options.lang if options.parsers is not a function #2', function () {
      var res = matter('---\nfoo = "bar"\n---\nbaz', {lang: 'toml'});
      checkFooBarBaz(res, 'foo', 'bar', 'baz');
    });
    it('options.lang should be override by the language specified after the delimiter #1', function () {
      var res = matter('---yaml\nfoo: bar\n---\nbaz', {lang: 'toml'});
      checkFooBarBaz(res, 'foo', 'bar', 'baz');
    });
    it('options.lang should be override by the language specified after the delimiter #2', function () {
      var res = matter('---toml\nfoo = "bar"\n---\nbaz', {lang: 'yaml'});
      checkFooBarBaz(res, 'foo', 'bar', 'baz');
    });
  });

  describe('matter(_, {delims: ?})', function () {
    it('should extract and parse the front matter if options.delims is a string', function () {
      var res = matter('~~~\nfoo: bar\n~~~\nbaz', {delims: '~~~'});
      checkFooBarBaz(res, 'foo', 'bar', 'baz');
    });
    it('should extract and parse the front matter if options.delims is an array of string(s) #1', function () {
      var res = matter('~~~\nfoo: bar\n~~~\nbaz', {delims: ['~~~']});
      checkFooBarBaz(res, 'foo', 'bar', 'baz');
    });
    it('should extract and parse the front matter if options.delims is an array of string(s) #2', function () {
      var res = matter('~~~\nfoo: bar\n~~~\nbaz', {delims: [null, '~~~']});
      checkFooBarBaz(res, 'foo', 'bar', 'baz');
    });
    it('should extract and parse the front matter if options.delims is an array of string(s) #3', function () {
      var res = matter('~~~\nfoo: bar\n^^^\nbaz', {delims: ['~~~', '^^^']});
      checkFooBarBaz(res, 'foo', 'bar', 'baz');
    });
  });

  describe('matter(_, {parsers: ?})', function () {
    it('should use the custom parser to parse YAML front matter', function () {
      var res = matter('---\n10\n---\nok', {
        parsers: {
          yaml: function (s, opts) {
            should(opts).be.Object;
            should(opts.loose).be.false;
            return s + 1;
          }
        }
      });
      normalCheck(res);
      res.body.should.equal('ok');
      should(res.data).equal('101');
    });
    it('should use the custom parser to parse TOML front matter', function () {
      var res = matter('---toml\n10\n---\nokay', {
        parsers: {
          toml: function (s, opts) {
            should(opts).be.Object;
            should(opts.loose).be.false;
            return s + 2;
          }
        }
      });
      normalCheck(res);
      res.body.should.equal('okay');
      should(res.data).equal('102');
    });
    it('should extend matter.parsers', function () {
      matter.parsers.number = function (s, opts) {
        should(opts).be.Object;
        should(opts.loose).be.false;
        return s + 3;
      };
      var res = matter('---number\n10\n---\nokay');
      normalCheck(res);
      res.body.should.equal('okay');
      should(res.data).equal('103');
      delete matter.parsers.number;
    });
    it('should ignore options.lang if options.parsers is a function', function () {
      var res = matter('---nothing\n10\n---\nnothing', {
        parsers: function (s, opts) {
            should(opts).be.Object;
            should(opts.loose).be.false;
            return parseInt(s, 10);
          }
      });
      normalCheck(res);
      res.body.should.equal('nothing');
      should(res.data).equal(10);
    });
  });

  describe('matter(_, {loose: true})', function () {
    it('should extract front matter between ambiguous delimiters', function () {
      var res = matter('----\n10\n----', {
        loose: true,
        parsers: function (s) { return parseInt(s, 10) + 1; }
      });
      normalCheck(res);
      res.body.should.equal('-');
      should(res.data).equal(11);
    });
  });

});


describe('matter.test(string, options)', function () {
  it('should return true if options.loose is false and front matter is found #1', function () {
    matter.test('---\n---').should.be.true;
  });
  ['', 'foobar', '---\n \n ---', '---\n', '\n---', '----\n \n---', '---\n \n----'].forEach(function (s, i) {
    it('should return false if options.loose is false and front matter is not found #' + (i + 1), function () {
      matter.test(s).should.be.false;
    });
  });
  ['----\n \n---', '---\n \n----'].forEach(function (s, i) {
    it('should return true if options.loose is true and front matter is found #' + (i + 1), function () {
      matter.test(s, {loose: true}).should.be.true;
    });
  });
  it('should return true for custom delimiters if front matter is found #1', function () {
    matter.test('~~~\n~~~', {delims: '~~~'}).should.be.true;
  });
  [ ['~~~'], [null, '~~~'], ['---\n', '---\n'], ['\n\n\n', '\n\n\n'] ].forEach(function (v, i) {
    it('should return true for custom delimiters if front matter is found #' + (i + 2), function () {
      matter.test((v[0] || v[1]) + '\n' + (v[1] || v[0]) + '\nfoo', {delims: v}).should.be.true;
    });
  });
});


describe('matter.readFileSync(path, options)', function () {
  for (var i = 1; i <= 8; i++) {
    (function (i) {
      it('should have no front matter #' + i, function () {
        var path = fixtures + 'no-matter-' + i + '.txt';
        var res;
        (function () {
          res = matter.readFileSync(path);
        }).should.not.throw();
        normalCheck(res, true);
        res.src.should.equal(res.body);
        res.path.should.equal(fs.realpathSync(path));
        should(res.data).be.null;
      });
    })(i);
  }
  for (var i = 1; i <= 2; i++) {
    (function (i) {
      it('should have front matter #' + i, function () {
        var path = fixtures + 'foo-matter-' + i + '.txt';
        var res;
        (function () {
          res = matter.readFileSync(path);
        }).should.not.throw();
        checkFooBarBaz(res, 'foo', 'bar', 'baz\n');
        res.path.should.equal(fs.realpathSync(path));
      });
    })(i);
  }
  for (var i = 1; i <= 2; i++) {
    (function (i) {
      it('should have front matter if options.loose is true #' + i, function () {
        var path = fixtures + 'loose-matter-' + i + '.txt';
        var res;
        (function () {
          res = matter.readFileSync(path, {
            loose: true,
            parsers: matter.parsers.yaml
          });
        }).should.not.throw();
        checkFooBarBaz(res, 'foo', 'bar', 'baz\n');
        res.path.should.equal(fs.realpathSync(path));
      });
    })(i);
  }
});


describe('matter.readFile(path, options, callback)', function () {
  for (var i = 1; i <= 8; i++) {
    (function (i) {
      it('should have no front matter #' + i, function (done) {
        var path = fixtures + 'no-matter-' + i + '.txt';
        matter.readFile(path, function (err, res) {
          should(!err).be.true;
          normalCheck(res, true);
          res.src.should.equal(res.body);
          res.path.should.equal(fs.realpathSync(path));
          should(res.data).be.null;
          done();
        });
      });
    })(i);
  }
  for (var i = 1; i <= 2; i++) {
    (function (i) {
      it('should have front matter #' + i, function (done) {
        var path = fixtures + 'foo-matter-' + i + '.txt';
        matter.readFile(path, function (err, res) {
          should(!err).be.true;
          checkFooBarBaz(res, 'foo', 'bar', 'baz\n');
          res.path.should.equal(fs.realpathSync(path));
          done();
        });
      });
    })(i);
  }
  for (var i = 1; i <= 2; i++) {
    (function (i) {
      it('should have front matter if options.loose is true #' + i, function (done) {
        var path = fixtures + 'loose-matter-' + i + '.txt';
        matter.readFile(path, {
          loose: true,
          parsers: matter.parsers.yaml
        }, function (err, res) {
          should(!err).be.true;
          checkFooBarBaz(res, 'foo', 'bar', 'baz\n');
          res.path.should.equal(fs.realpathSync(path));
          done();
        });
      });
    })(i);
  }
});
