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

  then(onFulfilled, onRejected) {
    if (this.status === "pending") {
      return new Future((resolve, reject) => {
        // resolve the new Future to be returned by `then` when the
        // current Future is resolved
        this.onFulfilledCallbacks.push(() => {
          const fulfilled = onFulfilled(this.value);

          // if the value returned by `then` is a thenable, call its
          // `then` method; otherwise resolve this future
          if (fulfilled && typeof fulfilled.then === "function") {
            fulfilled.then(resolve, reject);
          } else {
            resolve(fulfilled);
          }
        });

        this.onRejectedCallbacks.push(() => {
          reject(onRejected(this.reason));
        });
      });
    }

    // if (this.status === "fulfilled") {
    //   return new Future((resolve, reject) => {
    //     resolve(onFulfilled(this.value));
    //   });
    // }

    // if (this.status === "rejected") {
    //   onRejected(this.reason);
    //   return new Future();
    // }
  }
}

const createPromise = (v) => {
  return new Future((resolve, reject) => {
    setTimeout(() => {
      resolve(v);
    }, 1000);
  });
};

const p1 = createPromise("my value");
const p2 = createPromise("another value");
const p3 = createPromise("a final value");

p1.then((v) => {
  console.log(v);
  return p2;
})
  .then((v) => {
    console.log(v);
    return p3;
  })
  .then((v) => {
    console.log(v);
  });

setTimeout(() => {
  console.log(p1);
  console.log(p2);
  console.log(p3);
}, 5 * 1000);
