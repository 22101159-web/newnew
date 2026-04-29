import { useState, useEffect } from 'react';

export function useApiData(key, defaultValue) {
  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/data/${key}/`)
      .then(res => res.json())
      .then(res => {
        if (res.value && res.value !== 'null') {
          setData(JSON.parse(res.value));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [key]);

  const updateData = async (newData) => {
    setData(newData);
    try {
      await fetch(`/api/data/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: JSON.stringify(newData) })
      });
    } catch (e) {
      console.error(e);
    }
  };

  return [data, updateData, loading];
}
