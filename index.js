/**
 * a Future is instantiated with a callback function that takes two
 * arguments: a resolve function and a reject function
 *
 * the consumer may do some asynchronous task in the callback function
 * and then use resolve and reject to indicate whether the task
 * succeeded or failed; upon success the consumer can return a value and
 * upon failure the consumer can return a reason for the failure
 *
 * the Future object tracks the state of the asynchronous task and
 * provides a method for using the value of the asynchronous task or
 * recovering from failure
 */
class Future {
  constructor(fn) {
    this.state = "pending";
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    const resolve = (v) => {
      if (this.state === "pending") {
        this.state = "fulfilled";
        this.value = v;
        this.onFulfilledCallbacks.forEach((fn) => fn(v));
      }
    };

    const reject = (r) => {
      if (this.state === "pending") {
        this.state = "rejected";
        this.reason = r;
        this.onRejectedCallbacks.forEach((fn) => fn(r));
      }
    };

    fn(resolve, reject);
  }

  /**
   * if fn is a function, apply it to val and return output; otherwise
   * return val
   */
  _applyFnIfExists(fn, val) {
    return typeof fn === "function" ? fn(val) : val;
  }

  /**
   * if the value returned by `then` is a thenable, call its `then`
   * method; otherwise settle (resolve or reject) this future
   */
  _callThenIfThenable(val, resolve, reject) {
    if (val && typeof val.then === "function") {
      val.then(resolve, reject);
    } else {
      this.state === "fulfilled" ? resolve(val) : reject(val);
    }
  }

  /**
   * return a new Future object; add callbacks to the current Future
   * such that when it is settled, the new Future will also be settled
   */
  then(onFulfilled, onRejected) {
    // if the current Future is pending, add callbacks that will be
    // called when it is settled
    if (this.state === "pending") {
      return new Future((resolve, reject) => {
        // if the current Future is fulfilled, the returned Future will
        // also be fulfilled
        this.onFulfilledCallbacks.push(() => {
          const fulfilled = this._applyFnIfExists(onFulfilled, this.value);
          this._callThenIfThenable(fulfilled, resolve, reject);
        });

        // if the current Future is rejected, the returned Futured will
        // also be rejected
        this.onRejectedCallbacks.push(() => {
          const rejected = this._applyFnIfExists(onRejected, this.reason);
          this._callThenIfThenable(rejected, resolve, reject);
        });
      });
    }

    // if the current Future is already fulfilled, resolve the new
    // Future immediately
    if (this.state === "fulfilled") {
      return new Future((resolve, reject) => {
        const fulfilled = this._applyFnIfExists(onFulfilled, this.value);
        this._callThenIfThenable(fulfilled, resolve, reject);
      });
    }

    // if the current Future is already rejected, reject the new
    // Future immediately
    if (this.state === "rejected") {
      return new Future((resolve, reject) => {
        const rejected = this._applyFnIfExists(onRejected, this.reason);
        this._callThenIfThenable(rejected, resolve, reject);
      });
    }
  }

  catch(onRejected) {
    this.then(undefined, onRejected);
  }
}

// convenience functions for creating Futures
//
const createResolved = (v) => {
  return new Future((resolve, reject) => {
    setTimeout(() => {
      resolve(v);
    }, 1000);
  });
};

const createRejected = (r) => {
  return new Future((resolve, reject) => {
    setTimeout(() => {
      reject(r);
    }, 1000);
  });
};

// test Future object
//
const p1 = createResolved("my value");

p1.then((v) => {
  console.log(v);
  return createResolved("another value");
})
  .then((v) => {
    console.log(v);
    return createResolved("a final value");
  })
  .then((v) => {
    console.log(v);
    return createRejected("something broke");
  })
  .catch((r) => {
    console.log(r);
  });

setTimeout(() => {
  console.log(p1);
  p1.then((v) => {
    return createResolved("a value from a promise added after p1 is fulfilled");
  }).then((v) => {
    console.log(v);
  });
}, 5 * 1000);
