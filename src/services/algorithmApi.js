const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export const runAlgorithm = async (algorithmKey, numbers, target) => {
  const requestBody = target !== undefined ? { numbers, target } : { numbers };

  const response = await fetch(`${API_BASE_URL}/api/visualize/${algorithmKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    // This matches the Spring Boot request DTO shape used by the sorting and search endpoints.
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      errorText || `API request failed with status ${response.status}`,
    );
  }

  return response.json();
};
