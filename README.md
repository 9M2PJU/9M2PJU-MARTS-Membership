<div align="center">
  <img src="public/logo.png" alt="MARTS Logo" width="120" />
  <h1>MARTS Membership Directory</h1>
  <p><strong>The Unofficial Modern Membership Database for 9M/9W Hams</strong></p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E)](https://supabase.com/)
  [![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000)](https://vercel.com/)
  <br/>
  ![Website Status](https://img.shields.io/website?url=https%3A%2F%2F9m2pju-marts-membership.vercel.app&label=System%20Status&style=flat-square)
</div>

<br />

## 🚀 Overview

A high-performance, responsive web application tailored for the Malaysian Amateur Radio Transmitters' Society (MARTS). Built to provide lightning-fast lookups, advanced filtering, and a beautiful futuristic interface.

> **Note**: This is an unofficial community project made for 🇲🇾 by [9M2PJU](https://hamradio.my).

## ✨ Features

- **⚡ Blazing Fast**: Powered by Next.js App Router and Supabase.
- **Performance**:
    - **Parallel Data Fetching**: 4x faster initial load.
    - **Debounced Search**: Instant responsiveness.
    - **Memoized Components**: Optimized rendering.
- **🔍 Advanced Search**: Instant callsign, name, or ID lookup.
- **📻 Smart Filters**:
    - **Class**: A, B, C, and **SWL** support.
    - **Region**: West Malaysia, Sabah, Sarawak.
    - **Status**: Live Active/Expired sorting.
- **📱 Mobile Optimized**: Fully responsive PWA-ready design.
- **🎨 Modern UI**: Glassmorphism aesthetics with "Space/Orbitron" theme.
- **🛡️ RBAC Admin**: Role-based access control for Admins and Super Admins.

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + Lucide Icons |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Deployment** | [Vercel](https://vercel.com/) |

## 🚀 Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

- Node.js 18+ installed

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/9M2PJU/9M2PJU-MARTS-Membership.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Set up your `.env.local` file with Supabase credentials.

4. Run the development server
   ```sh
   npm run dev
   ```


## 📜 Callsign Structure

| Prefix | Region | Class |
|--------|--------|-------|
| **9M2** | West Malaysia | A |
| **9M6** | Sabah | A |
| **9M8** | Sarawak | A |
| **9W2** | West Malaysia | B |
| **9W6** | Sabah | B |
| **9W8** | Sarawak | B |
| **SWL** | West Malaysia | SWL |

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---
<div align="center">
  Made with ❤️ by 9M2PJU
</div>
