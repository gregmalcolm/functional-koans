JsKoansReporter = function(doc) {
  this.document = doc || document;
  this.suiteDivs = {};
  this.logRunningSpecs = false;
};

JsKoansReporter.prototype.createDom = function(type, attrs, childrenVarArgs) {
  var el = document.createElement(type);

  for (var i = 2; i < arguments.length; i++) {
    var child = arguments[i];

    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else {
      if (child) { el.appendChild(child); }
    }
  }

  for (var attr in attrs) {
    if (attr == "className") {
      el[attr] = attrs[attr];
    } else {
      el.setAttribute(attr, attrs[attr]);
    }
  }

  return el;
};

JsKoansReporter.prototype.reportRunnerStarting = function(runner) {
  var showPassed, showSkipped;

  this.outerDiv = this.createDom('div', { className: 'jasmine_reporter' },
      this.createDom('h1', { }, "Javascript Koans"),
      this.runnerDiv = this.createDom('div', { className: 'runner running' },
          this.createDom('a', { className: 'run_spec', href: '?' }, "run all"),
          this.runnerMessageSpan = this.createDom('span', {}, "Running..."),
          this.finishedAtSpan = this.createDom('span', { className: 'finished-at' }, ""))
      );

  this.document.body.appendChild(this.outerDiv);

  var suites = runner.suites();
  for (var i = 0; i < suites.length; i++) {
    var suite = suites[i];
    var suiteDiv = this.createDom('div', { className: 'suite' },
      this.createDom('a', { className: 'run_spec', href: '?spec=' + encodeURIComponent(suite.getFullName()) }, "run"),
      this.createDom('a', { className: 'description', href: '?spec=' + encodeURIComponent(suite.getFullName()) }, suite.description));
    this.suiteDivs[suite.id] = suiteDiv;
    var parentDiv = this.outerDiv;
    if (suite.parentSuite) {
      parentDiv = this.suiteDivs[suite.parentSuite.id];
    }
    parentDiv.appendChild(suiteDiv);
  }

   this.footerDiv = this.createDom('div', { className: 'banner' },
      this.createDom('div', { className: 'logo' },
        "Using Jasmine",
        this.createDom('span', { className: 'version' }, runner.env.versionString()))
      );

  this.outerDiv.appendChild(this.footerDiv);

  this.startedAt = new Date();

  var self = this;
};

JsKoansReporter.prototype.reportRunnerResults = function(runner) {
  var results = runner.results();
  var className = (results.failedCount > 0) ? "runner failed" : "runner passed";
  this.runnerDiv.setAttribute("class", className);
  //do it twice for IE
  this.runnerDiv.setAttribute("className", className);
  var specs = runner.specs();
  var specCount = 0;
  for (var i = 0; i < specs.length; i++) {
    if (this.specFilter(specs[i])) {
      specCount++;
    }
  }
  var message = "" + specCount + " spec" + (specCount == 1 ? "" : "s" ) + ", " + results.failedCount + " failure" + ((results.failedCount == 1) ? "" : "s");
  message += " in " + ((new Date().getTime() - this.startedAt.getTime()) / 1000) + "s";
  this.runnerMessageSpan.replaceChild(this.createDom('a', { className: 'description', href: '?'}, message), this.runnerMessageSpan.firstChild);

  this.finishedAtSpan.appendChild(document.createTextNode("Finished at " + new Date().toString()));
};

JsKoansReporter.prototype.reportSuiteResults = function(suite) {
  var results = suite.results();
  var status = results.passed() ? 'passed' : 'failed';
  if (results.totalCount == 0) { // todo: change this to check results.skipped
    status = 'skipped';
  }
  this.suiteDivs[suite.id].className += " " + status;
};

JsKoansReporter.prototype.reportSpecStarting = function(spec) {
  if (this.logRunningSpecs) {
    this.log('>> Jasmine Running ' + spec.suite.description + ' ' + spec.description + '...');
  }
};

JsKoansReporter.prototype.reportSpecResults = function(spec) {
  var results = spec.results();
  var status = results.passed() ? 'passed' : 'failed';
  if (results.skipped) {
    status = 'skipped';
  }
  var specDiv = this.createDom('div', { className: 'spec '  + status },
      this.createDom('a', { className: 'run_spec', href: '?spec=' + encodeURIComponent(spec.getFullName()) }, "run"),
      this.createDom('a', {
        className: 'description',
        href: '?spec=' + encodeURIComponent(spec.getFullName()),
        title: spec.getFullName()
      }, spec.description));


  var resultItems = results.getItems();
  var messagesDiv = this.createDom('div', { className: 'messages' });
  for (var i = 0; i < resultItems.length; i++) {
    var result = resultItems[i];

    if (result.type == 'log') {
      messagesDiv.appendChild(this.createDom('div', {className: 'resultMessage log'}, result.toString()));
    } else if (result.type == 'expect' && result.passed && !result.passed()) {
      messagesDiv.appendChild(this.createDom('div', {className: 'resultMessage fail'}, result.message));

      if (result.trace.stack) {
        messagesDiv.appendChild(this.createDom('div', {className: 'stackTrace'}, result.trace.stack));
      }
    }
  }

  if (messagesDiv.childNodes.length > 0) {
    specDiv.appendChild(messagesDiv);
  }

  this.suiteDivs[spec.suite.id].appendChild(specDiv);
};

JsKoansReporter.prototype.log = function() {
  var console = jasmine.getGlobal().console;
  if (console && console.log) console.log.apply(console, arguments);
};

JsKoansReporter.prototype.getLocation = function() {
  return this.document.location;
};

JsKoansReporter.prototype.specFilter = function(spec) {
  var paramMap = {};
  var params = this.getLocation().search.substring(1).split('&');
  for (var i = 0; i < params.length; i++) {
    var p = params[i].split('=');
    paramMap[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
  }

  if (!paramMap["spec"]) return true;
  return spec.getFullName().indexOf(paramMap["spec"]) == 0;
};