import * as DataStore from './data_store.js'

function printAll() {
  DataStore.RemoteStore.getAllCount().then(
    result => {
      const loading = document.getElementById('loading');
      loading.hidden = true;

      const table = document.getElementById('stat-table');
      for (const key in result) {
        const count = result[key];
        const row = table.insertRow();
        row.insertCell().innerHTML = key;
        row.insertCell().innerHTML = count;
      }
    }
  );
}

printAll();
