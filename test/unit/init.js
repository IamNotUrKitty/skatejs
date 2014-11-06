'use strict';

import helpers from '../lib/helpers';
import skate from '../../src/skate';

describe('skate.init', function () {
  var Div;

  beforeEach(function () {
    Div = skate('div', {
      created: function (element) {
        element.textContent = 'test';
      }
    });

    helpers.fixture('<div></div>');
  });

  it('should accept a selector', function () {
    expect(skate.init('#' + helpers.fixture().id + ' div').item(0).textContent).to.equal('test');
  });

  it('should accept a node', function () {
    expect(skate.init(helpers.fixture().querySelector('div')).textContent).to.equal('test');
  });

  it('should accept a node list', function () {
    expect(skate.init(helpers.fixture().querySelectorAll('div')).item(0).textContent).to.equal('test');
  });
});

describe('Synchronous initialisation', function () {
  it('should take an element', function () {
    var initialised = 0;

    skate('div', {
      attached: function () {
        ++initialised;
      }
    });

    skate.init(helpers.add('div'));
    assert(initialised);
  });
});

describe('Instantiation', function () {
  it('should return a constructor', function () {
    skate('div', {}).should.be.a('function');
  });

  it('should return a new element when constructed.', function () {
    var Div = skate('div', {});
    var div = new Div();
    div.nodeName.should.equal('DIV');
  });

  it('should synchronously initialise the new element.', function () {
    var called = false;
    var Div = skate('div', {
      prototype: {
        someMethod: function () {
          called = true;
        }
      }
    });

    new Div().someMethod();
    called.should.equal(true);
  });

  it('should call lifecycle callbacks at appropriate times.', function (done) {
    var created = false;
    var attached = false;
    var detached = false;
    var Div = skate('div', {
      created: function () {
        created = true;
      },
      attached: function () {
        attached = true;
      },
      detached: function () {
        detached = true;
      }
    });

    var div = new Div();
    created.should.equal(true, 'Should call created');
    attached.should.equal(false, 'Should not call attached');
    detached.should.equal(false, 'Should not call detached');

    document.body.appendChild(div);
    skate.init(div);
    attached.should.equal(true, 'Should call attached');
    detached.should.equal(false, 'Should not call remove');

    div.parentNode.removeChild(div);

    // Mutation Observers are async.
    setTimeout(function () {
      detached.should.equal(true, 'Should call detached');
      done();
    }, 1);
  });

  it('should initialise multiple instances of the same type of element (possible bug).', function (done) {
    var numCreated = 0;
    var numAttached = 0;
    var numDetached = 0;
    var Div = skate('div', {
      created: function () {
        ++numCreated;
      },
      attached: function () {
        ++numAttached;
      },
      detached: function () {
        ++numDetached;
      }
    });

    var div1 = new Div();
    var div2 = new Div();

    document.body.appendChild(div1);
    document.body.appendChild(div2);

    skate.init(div1);
    skate.init(div2);

    expect(numCreated).to.equal(2, 'created');
    expect(numAttached).to.equal(2, 'attached');

    div1.parentNode.removeChild(div1);
    div2.parentNode.removeChild(div2);

    // Mutation Observers are async.
    helpers.afterMutations(function () {
      expect(numDetached).to.equal(2, 'detached');
      done();
    });
  });

  it('should not allow ids that may have the same names as functions / properties on the object prototype', function () {
    var idsToSkate = ['hasOwnProperty', 'watch'];
    var idsToCheck = {};

    var div = document.createElement('div');
    div.className = idsToSkate.join(' ');

    idsToSkate.forEach(function (id) {
      skate(id, {
        type: skate.types.CLASS,
        created: function () {
          idsToCheck[id] = true;
        }
      });
    });

    skate.init(div);

    idsToSkate.forEach(function (id) {
      idsToCheck[id].should.equal(true);
    });
  });
});
