const {throttle} = require('lodash/function');
const {createStore} = require('redux');
const {default: configureStore} = require('redux-mock-store');

let dispatchFn,
  initialState = {},
  silent,
  store;

const STATE_KEY = 'reduxState';

const reducers = {
  '@@INIT': () => null,
  '@@redux/INIT': () => null,
  '@@async': state => state
};

function addReducer(type, fn) {
  reducers[type] = fn;
}

function deepFreeze(obj, freezing = []) {
  if (Object.isFrozen(obj) || freezing.includes(obj)) return;

  freezing.push(obj);

  const props = Object.getOwnPropertyNames(obj);
  for (const prop of props) {
    const value = obj[prop];
    if (typeof value === 'object' && value !== null) {
      deepFreeze(value, freezing);
    }
  }

  Object.freeze(obj);
}

function dispatch(type, payload) {
  // dispatchFn is not set in some tests.
  if (dispatchFn) dispatchFn({type, payload});
}

function getState() {
  return store.getState();
}

async function handleAsyncAction(promise) {
  const newState = await promise;
  dispatch('@@async', newState);
}

/**
 * This is called on app startup and
 * again each time the browser window is refreshed.
 * This function is only exported so it can be accessed from a test.
 */
function loadState() {
  const {sessionStorage} = window; // not available in tests

  try {
    const json = sessionStorage ? sessionStorage.getItem(STATE_KEY) : null;
    if (!json) return initialState;

    // When parsing errors Array, change to a Set.
    return JSON.parse(
      json,
      (key, value) => (key === 'errors' ? new Set(value) : value)
    );
  } catch (e) {
    if (!silent) console.error('redux-util loadState:', e.message);
    return initialState;
  }
}

function reducer(state = initialState, action) {
  const {payload, type} = action;
  if (!type) {
    throw new Error('action object passed to reducer must have type property');
  }

  const fn = reducers[type];
  if (!fn) {
    throw new Error(`no reducer found for action type "${type}"`);
  }

  const newState = fn(state, payload) || state;

  if (newState instanceof Promise) {
    handleAsyncAction(newState);
    return state;
  }

  deepFreeze(newState);
  return newState;
}

/**
 * Pass an object with these properties:
 * initialState: required object
 * render: render function (optional for tests)
 * mock: optional boolean to use mock Redux store
 * silent: optional boolean
 *   (true to silence expected error messages in tests)
 */
function reduxSetup(options) {
  ({initialState = {}, silent} = options);

  const extension = window.__REDUX_DEVTOOLS_EXTENSION__;
  const enhancer = extension && extension();
  const preloadedState = loadState();

  store = options.mock
    ? configureStore([])(initialState)
    : createStore(reducer, preloadedState, enhancer);
  dispatchFn = store.dispatch;

  if (!options.mock) {
    // See the video from Dan Abramov at
    // https://egghead.io/lessons/
    // javascript-redux-persisting-the-state-to-the-local-storage.
    store.subscribe(throttle(() => saveState(store.getState()), 1000));
    if (options.render) store.subscribe(options.render);
  }

  return store;
}

/**
 * This function is called by reduxSetup.
 * It is only exported so it can be accessed from a test.
 */
function saveState(state) {
  try {
    // When stringifying errors Set, change to an Array.
    const json = JSON.stringify(
      state,
      (key, value) => (key === 'errors' ? [...state.errors] : value)
    );

    sessionStorage.setItem(STATE_KEY, json);
  } catch (e) {
    if (!silent) console.error('redux-util saveState:', e.message);
    throw e;
  }
}

module.exports = {
  addReducer,
  deepFreeze,
  dispatch,
  getState,
  loadState,
  reducer, // exported to support tests
  reduxSetup,
  saveState
};
