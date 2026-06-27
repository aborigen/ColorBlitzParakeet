# Color Dash Blitz ⚡️

Color Dash Blitz is a fast-paced, hyper-casual color matching game built for the web. Test your reflexes as you match target colors against a ticking clock, featuring dynamic difficulty and AI-powered color insights.

## 🚀 Features

- **Fast-Paced Gameplay**: High-intensity matching that tests your speed and precision.
- **Dynamic Difficulty**: The game scales from 3 to 12 color choices with an accelerating timer.
- **AI Color Facts**: Receive unique color theory facts after every game session.
- **Immersive Audio**: High-energy sound effects for every game action with a mute toggle.
- **Yandex Games Integration**: Built-in support for Remote Config, full-screen ads, and global leaderboards.
- **Responsive Design**: Optimized with `dvh` units for a perfect "no-scroll" experience on smartphone portrait screens.
- **Static Export**: Fully compatible with static hosting (Yandex Games, GitHub Pages).

## 🛠 Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **AI Implementation**: [Genkit](https://firebase.google.com/docs/genkit) (for fact generation during development)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Platform**: Yandex Games SDK

## 🏁 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Build the static version:
   ```bash
   npm run build
   ```
   The static files will be generated in the `out/` directory.

## 📦 How to Push to GitHub

If your `git push` failed, follow these exact steps to ensure a clean setup:

1. **Initialize the Repository**:
   ```bash
   git init
   ```

2. **Add Your Files**:
   ```bash
   git add .
   ```

3. **Commit the Code**:
   ```bash
   git commit -m "Initial release of Color Dash Blitz"
   ```

4. **Create a Remote**:
   Go to GitHub, create a **new empty repository**, and copy the URL. Then run:
   ```bash
   git remote add origin <YOUR_REPOSITORY_URL>
   ```

5. **Push to Main**:
   ```bash
   git branch -M main
   git push -u origin main
   ```

### Common Push Errors:
- **"Remote origin already exists"**: Run `git remote remove origin` and try step 4 again.
- **"Permission denied"**: Ensure you have SSH keys set up or use a Personal Access Token for HTTPS.
- **"Updates were rejected"**: This usually means the remote repository isn't empty. Try `git push -f origin main` only if you are sure you want to overwrite the remote.

## 📄 License

This project is open-source and available under the MIT License.