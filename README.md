# EcoKids OS 🌱
### Learn Green. Play Green. Live Green.

**EcoKids OS** is an environmental education project that combines a customized Linux desktop experience with interactive learning, gamification, and eco-awareness activities. Designed with a child-friendly approach, it encourages users to understand environmental issues and develop sustainable habits through engaging digital experiences.

The project is developed as a customized desktop application running in a Linux virtual machine, with the goal of creating an educational operating system experience rather than just a web-based dashboard.

---

## ✨ Features

### 🌍 Environmental Learning
Explore environmental themes through interactive educational experiences.

- ♻️ **Recycle** — Learn about waste segregation, recycling, and reuse.
- 💧 **Save Water** — Understand water conservation and responsible usage.
- ⚡ **Save Energy** — Discover energy-saving practices.
- 🌳 **Protect Forests** — Learn about forests and ecosystem conservation.
- 🐾 **Protect Animals** — Explore wildlife and biodiversity.
- 🌡️ **Climate Awareness** — Understand climate change and environmental responsibility.

### 🎮 Interactive Games
EcoKids OS incorporates game-based learning to make environmental education engaging.

- **Panda Runner / Bamboo Dash** — An endless-runner-style game featuring a panda-themed experience.
- **Environmental Challenges** — Encourage sustainable choices through interactive gameplay.
- **Gamified Learning** — Connect learning activities with environmental awareness and progression.

### 🌱 Eco Engine
The Eco Engine is designed as the project's gamification and progression backbone.

Its intended responsibilities include:
- Environmental experience points (XP).
- User progression and levels.
- Achievement and badge tracking.
- Event-driven interactions.
- Persistent data storage using JSON.

### 🌎 Living World
The Living World concept represents environmental progress through a visual world that evolves across environmental stages. It is intended to connect user engagement and environmental learning with the state of the virtual ecosystem.

### 🐧 Linux Desktop Customization
EcoKids OS is developed to run in a Linux virtual machine and incorporates desktop-level customization.

The customization work includes:
- EcoKids OS branding and application identity.
- Custom application icon and visual assets.
- A Linux desktop application packaged for installation.
- Integration with the Linux application launcher.
- A foundation for further desktop, boot-screen, and theme customization.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React |
| Programming Language | TypeScript |
| Frontend Build Tool | Vite |
| Desktop Application Framework | Tauri |
| Native Layer | Rust |
| Environmental Engine | Python |
| Data Persistence | JSON |
| Linux Environment | Ubuntu |
| Virtualization | Oracle VirtualBox |
| Version Control | Git and GitHub |

---

## 🏗️ Project Structure

```text
EcoKids-OS/
├── app/                  # Desktop application and frontend
│   └── src-tauri/        # Tauri and Rust integration
├── assets/               # Project visual assets
├── branding/             # Logos, icons, and branding resources
├── docs/                 # Project documentation
├── eco_news/             # Environmental news module
├── eco_pet/              # Experimental eco-pet resources
├── eco_score/            # Environmental scoring and Eco Engine
├── ecobuddy/             # EcoBuddy assistant resources
├── games/                # Game-related resources
├── living_world/         # Living World module
├── linux_build/          # Linux build-related resources
├── research/             # Research and reference materials
├── scripts/              # Utility and automation scripts
├── story_campaign/       # Story-driven learning resources
├── themes/               # Theme and customization assets
├── .gitignore
└── README.md
```

*Note: The modules and folders represent the project's organization; the implementation status of individual features may vary.*

---

## 💻 Running EcoKids OS

EcoKids OS is intended to be demonstrated inside an Ubuntu virtual machine using Oracle VirtualBox.

### Prerequisites

- Oracle VirtualBox
- An Ubuntu Linux virtual machine
- Node.js and npm
- Rust and Cargo
- Tauri system dependencies for the selected Linux distribution

### Run the Application in Development Mode

1. Clone the repository:

   ```bash
   git clone https://github.com/BALAJIx64/EcoKids-OS.git
   cd EcoKids-OS
   ```

2. Navigate to the application directory:

   ```bash
   cd app
   ```

3. Install the frontend dependencies:

   ```bash
   npm install
   ```

4. Start the frontend development server:

   ```bash
   npm run dev
   ```

For the complete desktop application, use the Tauri development workflow configured by the project. The native Rust toolchain and required Linux dependencies must be installed.

### Build the Linux Application

From the `app/` directory, run:

```bash
npm run build
npx tauri build --bundles deb
```

The generated Debian installer is normally located under:

```text
src-tauri/target/release/bundle/deb/
```

The exact build output depends on the project's current Tauri configuration and installed dependencies.

To install a generated `.deb` package on Ubuntu:

```bash
sudo apt install ./src-tauri/target/release/bundle/deb/<package-name>.deb
```

Replace `<package-name>.deb` with the actual generated filename.

---

## 🎯 Project Objectives

- Make environmental education interactive and accessible.
- Encourage eco-friendly habits through game-based learning.
- Combine software development with Linux desktop customization.
- Explore gamification, persistence, and event-driven application design.
- Demonstrate a customized Linux-based educational experience in VirtualBox.

---

## 🚧 Future Enhancements

Potential directions for future development include:

- More environmental games and challenges.
- Expanded Living World interactions and animations.
- Improved integration between environmental activities and the Eco Engine.
- Additional eco-themed desktop visuals and sound effects.
- More interactive environmental stories and learning modules.
- Enhanced accessibility and child-friendly navigation.
- Further Linux desktop and startup customization.

---

## 🖥️ Demonstration Environment

The project is developed and tested in an Ubuntu Linux virtual machine using Oracle VirtualBox. The desktop application can be launched from the Linux application menu after installation.

The project aims to demonstrate both the educational application and the customized Linux environment.

---

## 🤝 Contributing

Contributions, suggestions, and ideas for improving environmental learning experiences are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test your changes in the intended environment.
5. Submit a pull request describing your improvements.

---

## 📄 License

A license has not yet been specified. Until one is added to the repository, reuse and redistribution are subject to the applicable copyright rules.

---

**EcoKids OS — Small actions. Greener futures.** 🌱
