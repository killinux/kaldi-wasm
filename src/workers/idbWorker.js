let modelStore = null;
let db = null;

function upgradeDB(database, previousVersion) {
  if (previousVersion === 0) {
    database.createObjectStore(modelStore.name,
      { keyPath: modelStore.keyPath });
  } else throw new Error('IDB version upgrade not implemented');
}


function getStored() {
  const objStore = db.transaction(modelStore.name)
    .objectStore(modelStore.name);
  return new Promise((res, rej) => {
    const req = objStore.getAllKeys();
    req.addEventListener('success', () => res(req.result));
    req.addEventListener('error', rej);
  });
}

function initDB(idbName, idbVersion) {
  return new Promise((resolve, rej) => {
    const req = indexedDB.open(idbName, idbVersion);

    req.onupgradeneeded = (event) => {
      db = req.result;
      upgradeDB(db, event.oldVersion);
    };

    req.addEventListener('success', () => {
      db = req.result;
      getStored()
        .then(resolve)
        .catch(rej);
    });

    req.addEventListener('error', rej);
  });
}

function getModelFromDB(modelName) {
  const objStore = db.transaction(modelStore.name)
    .objectStore(modelStore.name);
  const req = objStore.get(modelName);

  return new Promise((resolve, reject) => {
    req.addEventListener('success', () => {
      // may be undefined if not in DB
      if (req.result === undefined) reject(req.result);
      else resolve(req.result);
    });
    req.addEventListener('error', reject);
  });
}

function getModel(modelName) {
  return new Promise((resolve, reject) => {
    getModelFromDB(modelName)
      .then(resolve)
      .catch((e) => {
        reject(e);
      });
  });
}

function addModel(modelName, zip) {
  return new Promise((resolve, reject) => {
    const rwTransaction = db.transaction(modelStore.name, 'readwrite');
    const newEntry = { value: zip, [modelStore.keyPath]: modelName };
    rwTransaction.oncomplete = () => { resolve(newEntry); };

    const store = rwTransaction.objectStore(modelStore.name);
    const storeRequest = store.add(newEntry);
    storeRequest.onerror = (e) => { reject(e.target.error); };
  });
}

const helper = {
  async init(msg) {
    const { idbInfo } = msg.data;
    const { storeInfo } = idbInfo;
    modelStore = { name: storeInfo.name, keyPath: storeInfo.keyPath };
    return initDB(idbInfo.name, idbInfo.version);
  },
  async get(msg) {
    if (db === null) throw new Error('DB not initialized');
    return getModel(msg.data.modelName);
  },
  add(msg) {
    if (db === null) throw new Error('DB not initialized');
    return addModel(msg.data.modelName, msg.data.zip);
  },
  terminate() {
    if (db !== null) db.close();
  },
};

onmessage = (msg) => {
  const { command } = msg.data;
  const response = { command, ok: true };

  if (command in helper) {
    helper[command](msg)
      .then((value) => { response.value = value; })
      .catch((e) => {
        response.ok = false;
        response.value = e;
      })
      .finally(() => { postMessage(response); });
  } else {
    response.ok = false;
    response.value = new Error(`Unknown command '${command}'`);
    postMessage(response);
  }
};
