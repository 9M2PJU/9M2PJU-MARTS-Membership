<div align="center">
  <img src="public/logo.png" alt="MARTS Logo" width="120" />
  <h1>MARTS Membership Directory</h1>
  <p><strong>The Unofficial Modern Membership Database for 9M/9W Hams</strong></p>

  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC)](https://tailwindcss.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E)](https://supabase.com/)
  [![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000)](https://vercel.com/)
  <br/>
  [![Hits](https://hits.seeyoufarm.com/api/count/incr/badge.svg?url=https%3A%2F%2Fgithub.com%2F9M2PJU%2F9M2PJU-MARTS-Membership&count_bg=%2379C83D&title_bg=%23555555&icon=&icon_color=%23E7E7E7&title=hits&edge_flat=false)](https://hits.seeyoufarm.com)
  ![Website Status](https://img.shields.io/website?url=https%3A%2F%2F9m2pju-marts-membership.vercel.app&label=System%20Status&style=flat-square)
</div>

<br />

## 🚀 Overview

A high-performance, responsive web application tailored for the Malaysian Amateur Radio Transmitters' Society (MARTS). Built to provide lightning-fast lookups, advanced filtering, and a beautiful futuristic interface.

> **Note**: This is an unofficial community project made for 🇲🇾 by [9M2PJU](https://hamradio.my).

## ✨ Features

- **⚡ Blazing Fast**: Powered by Next.js App Router and Supabase.
- **🔍 Advanced Search**: Instant callsign, name, or ID lookup with debouncing.
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
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + Lucide Icons |
| **Database** | [Supabase](https://supabase.com/) (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Deployment** | [Vercel](https://vercel.com/) |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Supabase Account

### Installation

1.  **Clone the repo**
    ```bash
    git clone https://github.com/9M2PJU/9M2PJU-MARTS-Membership.git
    cd 9M2PJU-MARTS-Membership
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Setup Environment**
    Create a `.env.local` file:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run Development Server**
    ```bash
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
