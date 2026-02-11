# ΣΦΕ Rush API

A backend REST API built with Node.js, Express, and TypeScript to support the [SigEpRush iOS application](https://github.com/simonbalanoff/SigEpRush-App/).  
The API provides structured access to rush-related data, handles media uploads, and enforces core business logic used throughout the app.

This repository is public for portfolio and code demonstration purposes only and is not intended for production or external use.

---

## Overview

The SigEpRush API was designed to serve as a centralized backend for managing potential new member data, internal evaluations, and related workflows. It prioritizes clear data modeling, type safety, and maintainable route structure.

The API is deployed using Render and integrates cloud services for persistence and media storage.

---

## Tech Stack

- Node.js
- Express
- TypeScript
- MongoDB for data persistence
- AWS S3 for image storage
- Render for deployment

---

## Architecture

- Modular route and controller structure
- Strong typing across request/response boundaries
- Separation of business logic from routing
- Externalized services for database and media handling

---

## Related Repositories

- **[SigEpRush App (iOS)](https://github.com/simonbalanoff/SigEpRush-App/)** — Native Swift client that consumes this API

---

## Notes

This project is intended to showcase backend architecture, API design, and TypeScript usage.  
It is not configured for public use, production traffic, or long-term maintenance.
