# Crewdle Mist Indexed DB Connector

## Introduction

The Crewdle Mist IndexedDB Connector is designed to efficiently connect your Key-Value Database service with IndexedDB, a client-side storage API. It enables smooth and direct data storage in IndexedDB, providing a seamless link for handling and managing key-value pairs. This connector streamlines the process of syncing your database service with IndexedDB, facilitating easy and reliable data storage without the need for intricate configurations or supplementary software. It's an ideal solution for those seeking to utilize the capabilities of IndexedDB for efficient, scalable, and accessible client-side data storage.

## Getting Started

Before diving in, ensure you have installed the [Crewdle Mist SDK](https://www.npmjs.com/package/@crewdle/web-sdk).

## Installation

```bash
npm install @crewdle/mist-connector-indexed-db
```

## Usage

```TypeScript
import { IDBDatabaseConnector } from '@crewdle/mist-connector-indexed-db';

// Create a new SDK instance
const sdk = await SDK.getInstance('[VENDOR ID]', '[ACCESS TOKEN]', {
  keyValueDatabaseConnector: IDBDatabaseConnector,
});
```

## Need Help?

Reach out to support@crewdle.com or raise an issue in our repository for any assistance.

## Join Our Community

For an engaging discussion about your specific use cases or to connect with fellow developers, we invite you to join our Discord community. Follow this link to become a part of our vibrant group: [Join us on Discord](https://discord.gg/XJ3scBYX).
