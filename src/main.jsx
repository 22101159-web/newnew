import React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Override setItem to sync backend
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  originalSetItem.apply(this, arguments);
  if (key.startsWith('emis_')) {
    fetch(`/api/data/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value })
    }).catch(console.error);
  }
};

async function initData() {
  const keys = ['emis_events', 'emis_presets', 'emis_community_presets', 'emis_messages'];
  try {
    await Promise.all(keys.map(async key => {
      const res = await fetch(`/api/data/${key}`);
      if (res.ok) {
        const data = await res.json();
        // If DB has data, load it into local storage
        if (data.value && data.value !== 'null') {
          originalSetItem.call(localStorage, key, data.value);
        } else {
          // If DB is empty but we have local data, push local data to DB
          const localVal = localStorage.getItem(key);
          if (localVal && localVal !== '[]' && localVal !== '{}') {
            fetch(`/api/data/${key}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ value: localVal })
            }).catch(console.error);
          }
        }
      }
    }));
  } catch (e) {
    console.error('Failed to sync initial data', e);
  }
}

async function syncData() {
  const keys = ['emis_events', 'emis_presets', 'emis_community_presets', 'emis_messages'];
  try {
    await Promise.all(keys.map(async key => {
      const res = await fetch(`/api/data/${key}`);
      if (res.ok) {
        const data = await res.json();
        if (data.value && data.value !== 'null') {
          const currentLocal = localStorage.getItem(key);
          // Only update if data is different to avoid unnecessary React re-renders triggered by localStorage polling
          if (data.value !== currentLocal) {
            originalSetItem.call(localStorage, key, data.value);
          }
        }
      }
    }));
  } catch (e) {
    console.error('Periodic sync failed', e);
  }
}

initData().finally(() => {
  // Start periodic polling for real-time updates
  setInterval(syncData, 5000);

  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
