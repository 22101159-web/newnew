class ApiStorage {
  async getItem(key, defaultValue = null) {
    try {
      const res = await fetch(`/api/data/${key}`);
      if (!res.ok) return defaultValue;
      const data = await res.json();
      if (data.value === 'null' || !data.value) return defaultValue;
      return JSON.parse(data.value);
    } catch (e) {
      console.error('ApiStorage getItem error', e);
      return defaultValue;
    }
  }

  async setItem(key, value) {
    try {
      const payload = { value: JSON.stringify(value) };
      await fetch(`/api/data/${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
    } catch (e) {
      console.error('ApiStorage setItem error', e);
    }
  }
}

export const apiStorage = new ApiStorage();
