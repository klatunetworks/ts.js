// ts.js - version 0.9.2
//
// Copyright 2012 Dan Simpson, Mike Countis
//
// MIT License
var $ts = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // ts.coffee
  var ts_exports = {};
  __export(ts_exports, {
    default: () => ts_default
  });
  var MultiTimeseries;
  var NumericTimeseries;
  var Timeseries;
  var TimeseriesFactory;
  var factory;
  TimeseriesFactory = class TimeseriesFactory2 {
    constructor() {
    }
    validate(data) {
      if (data.length === 0) {
        throw "Timeseries expects an array of data.";
      }
      if (data[0].length !== 2) {
        throw "Timeseries expects input like [[timestamp, value]...]";
      }
      if (typeof data[0][0] !== "number") {
        throw "Timeseries expects timestamps; eg: [[timestamp, value]...]";
      }
    }
    // Convert a 1-dimensional array to a 2d arry with
    // timestamps and values
    // +data+ the array of objects to timestamp
    // +start+ the start time (defaults to now)
    // +step+ the number of milliseconds between each
    timestamp(data, start = (/* @__PURE__ */ new Date()).getTime(), step = 6e4) {
      var i, j, len, r, v;
      i = 0;
      r = [];
      for (j = 0, len = data.length; j < len; j++) {
        v = data[j];
        r.push([start + i++ * step, v]);
      }
      return r;
    }
    // Wrap 2d array of timeseries data in a Timeseries object
    wrap(data, validate = true) {
      if (validate) {
        this.validate(data);
      }
      return new Timeseries(data);
    }
    // Create a NumericTimeseries object, capable basic plotting, etc
    numeric(data, validate = true) {
      if (validate) {
        this.validate(data);
        if (typeof data[0][1] !== "number") {
          throw "NumericTimeseries expects timestamps and numbers; eg: [[timestamp, number]...]";
        }
      }
      return new NumericTimeseries(data);
    }
    // create a MultiTimeseries object with the data
    multi(data, validate = true) {
      if (validate) {
        this.validate(data);
      }
      return new MultiTimeseries(data);
    }
    // Guess what kind of data we are working with
    build(data) {
      this.validate(data);
      if (typeof data[0][1] === "number") {
        return this.numeric(data);
      } else if (typeof data[0][1] === "string") {
        return this.wrap(data);
      } else {
        return this.multi(data);
      }
    }
  };
  factory = new TimeseriesFactory();
  Timeseries = class Timeseries2 {
    constructor(data1) {
      this.data = data1;
      this.squelched = false;
      this.listeners = [];
      this.init_listeners = [];
      this.timeframe = null;
    }
    // the number of samples
    size() {
      return this.data.length;
    }
    empty() {
      return this.data.length === 0;
    }
    // the number of samples
    length() {
      return this.data.length;
    }
    // the number of samples
    count() {
      return this.data.length;
    }
    // given a range of timestamps, find the nearest indices
    // for slicing
    slice_indices(t1, t2) {
      var idx1, idx2;
      idx1 = this.nearest(t1);
      idx2 = this.nearest(t2);
      if (this.time(idx1) < t1) {
        ++idx1;
      }
      if (this.time(idx2) < t2) {
        ++idx2;
      }
      return [idx1, idx2];
    }
    // limit the total duration, or time frame of the
    // time series
    limit(duration) {
      this.timeframe = duration;
      return this;
    }
    // If timeframe is set, trim head of series
    behead() {
      var count, head, min;
      if (this.timeframe === null) {
        return [];
      }
      min = this.end() - this.timeframe;
      count = 0;
      while (this.data[count][0] < min) {
        count++;
      }
      head = this.data.slice(0, count);
      this.data = this.data.slice(count);
      return head;
    }
    // the first sample
    first() {
      return this.data[0];
    }
    // the last sample
    last() {
      return this.data[this.size() - 1];
    }
    // get the sample at index idx
    sample(idx) {
      return this.data[idx];
    }
    // get the time at index idx
    time(idx) {
      return this.data[idx][0];
    }
    // get the value at index idx
    value(idx) {
      return this.data[idx][1];
    }
    // time domain (earliest, latest)
    domain() {
      return [this.first()[0], this.last()[0]];
    }
    // append another timerseries item
    append(t, v) {
      if (this.empty()) {
        this.data.push([t, v]);
        return;
      }
      if (t < this.end()) {
        throw "Can't append sample with past timestamp";
      }
      this.data.push([t, v]);
      this.behead();
      return this.notify();
    }
    // see append
    push(t, v) {
      return this.append(t, v);
    }
    // see append
    add(t, v) {
      return this.append(t, v);
    }
    // notify listeners of a change
    notify() {
      var j, k, len, len1, listener, ref, ref1, results;
      if (this.squelched) {
        return;
      }
      if (this.size() === 2) {
        ref = this.init_listeners;
        for (j = 0, len = ref.length; j < len; j++) {
          listener = ref[j];
          listener();
        }
      }
      ref1 = this.listeners;
      results = [];
      for (k = 0, len1 = ref1.length; k < len1; k++) {
        listener = ref1[k];
        results.push(listener());
      }
      return results;
    }
    listen(fn) {
      return this.listeners.push(fn);
    }
    on_init(fn) {
      return this.init_listeners.push(fn);
    }
    // values as 1d array
    values() {
      var j, len, r, ref, t, v;
      r = [];
      ref = this.data;
      for (j = 0, len = ref.length; j < len; j++) {
        [t, v] = ref[j];
        r.push(v);
      }
      return r;
    }
    // The total duration of the series
    duration() {
      return this.end() - this.start();
    }
    // The start time
    start() {
      return this.first()[0];
    }
    // The end time
    end() {
      return this.last()[0];
    }
    // scan timeseries and get the range of events between
    // time nearest values of t1 and time t2
    scan(t1, t2) {
      var idx1, idx2;
      [idx1, idx2] = this.slice_indices(t1, t2);
      return new this.constructor(this.data.slice(idx1, idx2));
    }
    // filter out items and return new
    // timeseries
    filter(fn) {
      var j, len, r, ref, tv;
      r = [];
      ref = this.data;
      for (j = 0, len = ref.length; j < len; j++) {
        tv = ref[j];
        if (fn(tv[0], tv[1])) {
          r.push(tv);
        }
      }
      return new this.constructor(r);
    }
    // split the series into two series
    split(time) {
      var j, len, r1, r2, ref, tv;
      r1 = [];
      r2 = [];
      ref = this.data;
      for (j = 0, len = ref.length; j < len; j++) {
        tv = ref[j];
        if (tv[0] <= time) {
          r1.push(tv);
        } else {
          r2.push(tv);
        }
      }
      return [new this.constructor(r1), new this.constructor(r2)];
    }
    // Break data into windows of a given duration, returning
    // a timeseries of timeseries objects
    partition(duration) {
      var chunk, j, len, ref, result, t, time, v;
      time = this.start() - Math.abs(this.start() % duration);
      result = [];
      chunk = [];
      ref = this.data;
      for (j = 0, len = ref.length; j < len; j++) {
        [t, v] = ref[j];
        while (t - time >= duration) {
          result.push([time, factory.build(chunk)]);
          chunk = [];
          time += duration;
        }
        chunk.push([t, v]);
      }
      if (chunk.length > 0) {
        result.push([time, factory.build(chunk)]);
      }
      return factory.wrap(result, false);
    }
    // map each series tuple to a new tuple via function call
    map(fn) {
      var j, len, r, ref, tv;
      r = [];
      ref = this.data;
      for (j = 0, len = ref.length; j < len; j++) {
        tv = ref[j];
        r.push(fn(tv[0], tv[1]));
      }
      return factory.build(r);
    }
    // partition by duration and fold each partitioned sub-series
    // into a new value
    pfold(duration, fn) {
      return this.partition(duration).map(fn);
    }
    // timestamps as 1d array
    timestamps() {
      var j, len, r, ref, t, v;
      r = [];
      ref = this.data;
      for (j = 0, len = ref.length; j < len; j++) {
        [t, v] = ref[j];
        r.push(t);
      }
      return r;
    }
    // finds the nearest index in the domain using
    // a binary search
    // +timestamp+ the time to search for
    // +lbound+ if true, the index will always justify to the past
    nearest(timestamp, lbound = false) {
      var idx;
      if (timestamp <= this.start()) {
        return 0;
      }
      if (timestamp >= this.end()) {
        return this.size() - 1;
      }
      idx = this.bsearch(timestamp, 0, this.size() - 1);
      if (lbound && this.time(idx) > timestamp) {
        idx = Math.max(0, idx - 1);
      }
      return idx;
    }
    // binary search for a timestamp with some fuzzy
    // matching if we don't get the exact idx
    bsearch(timestamp, idx1, idx2) {
      var diff1, diff2, mid;
      mid = Math.floor((idx2 - idx1) / 2) + idx1;
      if (idx1 === mid) {
        diff1 = Math.abs(this.time(idx1) - timestamp);
        diff2 = Math.abs(this.time(idx2) - timestamp);
        if (diff2 > diff1) {
          return idx1;
        } else {
          return idx2;
        }
      } else if (timestamp < this.time(mid)) {
        return this.bsearch(timestamp, idx1, mid);
      } else if (timestamp > this.time(mid)) {
        return this.bsearch(timestamp, mid, idx2);
      } else {
        return mid;
      }
    }
    // report
    toString() {
      return `Timeseries
items   : ${this.size()}
domain  : ${this.domain()}`;
    }
  };
  NumericTimeseries = class NumericTimeseries2 extends Timeseries {
    constructor(data) {
      super(data);
    }
    statistics() {
      var j, len, max, min, ref, sum, t, v;
      if (this._stats) {
        return this._stats;
      }
      sum = 0;
      min = Infinity;
      max = -Infinity;
      ref = this.data;
      for (j = 0, len = ref.length; j < len; j++) {
        [t, v] = ref[j];
        sum += v;
        if (v > max) {
          max = v;
        }
        if (v < min) {
          min = v;
        }
      }
      return this._stats = {
        sum,
        min,
        max
      };
    }
    // shift the first item off the list and update stats
    behead() {
      var head, j, len, t, v;
      head = super.behead();
      if (head.length === 0 || !this._stats) {
        return;
      }
      for (j = 0, len = head.length; j < len; j++) {
        [t, v] = head[j];
        this._stats.sum -= v;
        if (v === this._stats.min || v === this._stats.max) {
          this._stats = false;
          return;
        }
      }
    }
    // append another timerseries item, updating calcs
    append(t, v) {
      if (t < this.end()) {
        throw "Can't append sample with past timestamp";
      }
      if (this._stats) {
        this._stats.sum += v;
        this._stats.min = Math.min(this._stats.min, v);
        this._stats.max = Math.max(this._stats.max, v);
      }
      return super.append(t, v);
    }
    // the sum of all values
    sum() {
      return this.statistics().sum;
    }
    // the sum of squares
    sumsq() {
      var j, len, m, n, r, ref, t, v;
      m = this.mean();
      r = 0;
      ref = this.data;
      for (j = 0, len = ref.length; j < len; j++) {
        [t, v] = ref[j];
        n = v - m;
        r += n * n;
      }
      return r;
    }
    // variance of the values
    variance() {
      return this.sumsq() / (this.size() - 1);
    }
    // standard deviation of the values
    stddev() {
      return Math.sqrt(this.variance());
    }
    // mean of value
    mean() {
      return this.sum() / this.size();
    }
    // value range (min, max)
    range() {
      return [this.min(), this.max()];
    }
    // value range (min, max)
    span() {
      return this.max() - this.min();
    }
    // minimum of value
    min() {
      return this.statistics().min;
    }
    // maximum of values
    max() {
      return this.statistics().max;
    }
    // values as 1d array
    values() {
      var j, len, r, ref, t, v;
      r = [];
      ref = this.data;
      for (j = 0, len = ref.length; j < len; j++) {
        [t, v] = ref[j];
        r.push(v);
      }
      return r;
    }
    // return a sorted set of values
    valuesSorted() {
      if (this._valuesSorted) {
        return this._valuesSorted;
      }
      return this._valuesSorted = this.values().sort(function(a, b) {
        return a - b;
      });
    }
    quartiles() {
      return {
        min: this.min(),
        p25: this.p25th(),
        mid: this.median(),
        p75: this.p75th(),
        max: this.max()
      };
    }
    p25th() {
      return this.percentile(0.25);
    }
    p75th() {
      return this.percentile(0.75);
    }
    median() {
      return this.percentile(0.5);
    }
    percentile(p) {
      var idx;
      idx = Math.floor(this.size() * p);
      if (this.size() % 2) {
        return this.valuesSorted()[idx];
      } else {
        return (this.valuesSorted()[idx - 1] + this.valuesSorted()[idx]) / 2;
      }
    }
    // normalized values as 1d array
    norms() {
      var j, len, r, ref, t, v;
      r = [];
      ref = this.data;
      for (j = 0, len = ref.length; j < len; j++) {
        [t, v] = ref[j];
        r.push((v - this.mean()) / this.stddev());
      }
      return r;
    }
    // simplifies the data set based on a percentage change
    // If the range is great, yet the standard deviation is low
    // then we will not reduce much
    // Todo: Douglas Peuker
    simplify(threshold = 0.1) {
      var j, last, len, r, range, ref, tv;
      last = this.first();
      range = this.max() - this.min();
      r = [last];
      ref = this.data;
      for (j = 0, len = ref.length; j < len; j++) {
        tv = ref[j];
        if (Math.abs(tv[1] - last[1]) / range > threshold) {
          if (last[0] !== r[r.length - 1][0]) {
            r.push(last);
          }
          r.push(tv);
        }
        last = tv;
      }
      if (last[0] !== r[r.length - 1][0]) {
        r.push(last);
      }
      return factory.build(r);
    }
    // Find the best fit match for the pattern in the
    // time series.  The data is first normalized
    match(pattern) {
      var best, distance, i, idx, j, query, ref, source;
      if (!(pattern instanceof Timeseries)) {
        throw "Must match against a Timeseries object";
      }
      best = 999999999;
      idx = -1;
      query = pattern.norms();
      source = this.norms();
      if (!(query.length <= source.length)) {
        throw "Query length exceeds source length";
      }
      for (i = j = 0, ref = source.length - query.length - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
        distance = this._distance(query, source.slice(i, +(i + query.length) + 1 || 9e9));
        if (distance < best) {
          best = distance;
          idx = i;
        }
      }
      return idx;
    }
    // Euclidean distance function for one timeseries on another
    // used for pattern searching
    _distance(ts1, ts2) {
      var diff, i, j, ref, sum;
      if (ts1.length !== ts2.length) {
        throw "Array lengths must match for distance";
      }
      sum = 0;
      for (i = j = 0, ref = ts1.length - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
        diff = ts2[i] - ts1[i];
        sum += diff * diff;
      }
      return Math.sqrt(sum);
    }
    // report
    toString() {
      return `Timeseries
items   : ${this.size()}
mean    : ${this.mean()}
stddev  : ${this.stddev()}
domain  : ${this.domain()}
range   : ${this.range()}
variance: ${this.variance()}`;
    }
  };
  MultiTimeseries = class MultiTimeseries2 extends Timeseries {
    constructor(data) {
      var j, key, len, point, ref, ref1, ref2, value;
      super(data);
      this.lookup = {};
      this.attrs = [];
      ref = this.data;
      for (j = 0, len = ref.length; j < len; j++) {
        point = ref[j];
        ref1 = point[1];
        for (key in ref1) {
          value = ref1[key];
          if (!this.lookup.hasOwnProperty(key)) {
            this.lookup[key] = [];
            this.attrs.push(key);
          }
          this.lookup[key].push([point[0], value]);
        }
      }
      ref2 = this.lookup;
      for (key in ref2) {
        value = ref2[key];
        this.lookup[key] = factory.build(this.lookup[key]);
      }
    }
    // find a series by name or path
    // eg: mts.series("hits")
    // eg: mts.series("hostname.com/hits")
    series(name) {
      var head, parts;
      if (name[0] === "/") {
        return this.series(name.substr(1));
      }
      if (name.indexOf("/") > 0) {
        parts = name.split("/");
        head = parts.shift();
        if (!this.lookup[head]) {
          return null;
        }
        return this.lookup[head].series(parts.join("/"));
      }
      if (!this.lookup[name]) {
        return null;
      }
      return this.lookup[name];
    }
    get(name) {
      return this.series(name);
    }
    limit(duration) {
      var name, ref, results, ts;
      super.limit(duration);
      ref = this.lookup;
      results = [];
      for (name in ref) {
        ts = ref[name];
        results.push(ts.limit(duration));
      }
      return results;
    }
    append(t, v) {
      var key, value;
      for (key in v) {
        value = v[key];
        if (this.lookup.hasOwnProperty(key)) {
          this.lookup[key].append(t, value);
        } else {
          this.lookup[key] = factory.build([[t, value]]);
          this.attrs.push(key);
        }
      }
      return super.append(t, v);
    }
    attr(name) {
      return this.series(name);
    }
    serieses() {
      return this.attrs;
    }
    // minimum of value
    min() {
      var key, mins, ref, series;
      mins = [];
      ref = this.lookup;
      for (key in ref) {
        series = ref[key];
        if (series.min) {
          mins.push(series.min());
        }
      }
      return Math.min.apply(Math, mins);
    }
    // maximum of values
    max() {
      var key, maxes, ref, series;
      maxes = [];
      ref = this.lookup;
      for (key in ref) {
        series = ref[key];
        if (series.max) {
          maxes.push(series.max());
        }
      }
      return Math.max.apply(Math, maxes);
    }
    // determine if a series exists by name
    exists(name) {
      return this.series(name) !== null;
    }
  };
  var ts_default = factory;
  return __toCommonJS(ts_exports);
})();
//# sourceMappingURL=ts.js.map
