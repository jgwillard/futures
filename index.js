class Future {
  constructor(fn) {
    this.status = "pending";
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    const resolve = (v) => {
      if (this.status === "pending") {
        this.status = "fulfilled";
        this.value = v;
        this.onFulfilledCallbacks.forEach((fn) => fn(v));
      }
    };

    const reject = (r) => {
      if (this.status === "pending") {
        this.status = "rejected";
        this.reason = r;
        this.onRejectedCallbacks.forEach((fn) => fn(r));
      }
    };

    fn(resolve, reject);
  }

  _applyFnIfExists(fn, val) {
    return typeof fn === "function" ? fn(val) : val;
  }

  then(onFulfilled, onRejected) {
    if (this.status === "pending") {
      return new Future((resolve, reject) => {
        // resolve the new Future to be returned by `then` when the
        // current Future is resolved
        this.onFulfilledCallbacks.push(() => {
          const fulfilled = this._applyFnIfExists(onFulfilled, this.value);

          // if the value returned by `then` is a thenable, call its
          // `then` method; otherwise resolve this future
          if (fulfilled && typeof fulfilled.then === "function") {
            fulfilled.then(resolve, reject);
          } else {
            resolve(fulfilled);
          }
        });

        this.onRejectedCallbacks.push(() => {
          const rejected = this._applyFnIfExists(onRejected, this.reason);

          if (rejected && typeof rejected.then === "function") {
            rejected.then(resolve, reject);
          } else {
            reject(rejected);
          }
        });
      });
    }

    if (this.status === "fulfilled") {
      return new Future((resolve, reject) => {
        const fulfilled = this._applyFnIfExists(onFulfilled, this.value);
        if (fulfilled && typeof fulfilled.then === "function") {
          fulfilled.then(resolve, reject);
        } else {
          resolve(fulfilled);
        }
      });
    }

    if (this.status === "rejected") {
      return new Future((resolve, reject) => {
        const rejected = this._applyFnIfExists(onRejected, this.reason);
        if (rejected && typeof rejected.then === "function") {
          rejected.then(resolve, reject);
        } else {
          reject(rejected);
        }
      });
    }
  }

  catch(onRejected) {
    this.then(undefined, onRejected);
  }
}

// test Future object
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
