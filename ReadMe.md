# useNetworkRequestQueue

## Overview

⚠️ **This package is in beta testing. Use at your own risk!**  
Expect potential bugs, and contributions are welcome.

`useNetworkRequestQueue` is a custom React hook that queues network requests when offline and retries them automatically when the internet connection is restored. This helps improve user experience by ensuring requests are not lost due to connectivity issues.

## Features

✅ Automatically detects offline mode and queues API requests.  
✅ Retries queued requests when the connection is restored.  
✅ Supports any network request function that returns a Promise.  
✅ Provides real-time status of the user's connection.  
✅ Uses `useState`, `useEffect`, `useCallback`, and `useMemo` for efficient state management.

## Installation

```sh
npm install use-network-request-queue
```

## Usage

### Import the Hook

```tsx
import { useNetworkRequestQueue } from "use-network-request-queue";
```

### Basic Example

```tsx
const { addRequest, isOffline, pendingRequests } = useNetworkRequestQueue();

const handleSubmit = () => {
  addRequest(() =>
    fetch("/api/save-data", {
      method: "POST",
      body: JSON.stringify({ message: "Hello World" }),
    })
  );
};

return (
  <div>
    <button onClick={handleSubmit} disabled={isOffline}>
      Submit
    </button>
    {isOffline && <p>Offline - {pendingRequests.length} requests queued</p>}
  </div>
);
```

## API

### `useNetworkRequestQueue()`

Returns an object with the following properties:

| Property          | Type                                    | Description                                                                   |
| ----------------- | --------------------------------------- | ----------------------------------------------------------------------------- |
| `addRequest`      | `(request: () => Promise<any>) => void` | Adds a request to the queue if offline, or executes it immediately if online. |
| `isOffline`       | `boolean`                               | Indicates whether the user is currently offline.                              |
| `pendingRequests` | `Array<() => Promise<any>>`             | An array of network requests waiting to be executed.                          |

## How It Works

1. When `addRequest` is called, the request function is added to the queue **only if the user is offline**.
2. If the user is online, the request is executed immediately.
3. When the internet connection is restored, the hook automatically processes and retries all queued requests.

## Contributing

Contributions are welcome! If you have suggestions, feature requests, or bug reports, please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.
