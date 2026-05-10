# Color Dash Blitz ⚡️

Color Dash Blitz is a fast-paced, hyper-casual color matching game built for the web. Test your reflexes as you match target colors against a ticking clock, featuring dynamic difficulty and AI-powered color insights.

## 🚀 Features

- **Fast-Paced Gameplay**: High-intensity matching that tests your speed and precision.
- **Dynamic Difficulty**: The game scales from 3 to 6 color choices as your score increases.
- **AI Color Facts**: Powered by Genkit and Google Gemini, receive a unique color theory fact after every game session.
- **Immersive Audio**: Catchy background music with a convenient mute toggle.
- **Yandex Games Integration**: Ready for distribution with built-in support for full-screen ads and global leaderboards.
- **Responsive Design**: Optimized for both mobile and desktop, ensuring a seamless experience without scrolling.
- **Multilingual Support**: Available in both English and Russian.

## 🛠 Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **AI Implementation**: [Genkit](https://firebase.google.com/docs/genkit) with Google Gemini
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Platform SDK**: Yandex Games SDK

## 🏁 Getting Started

First, install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

## 📦 Pushing to Git

Since this project was generated as a prototype, you can push it to your own repository by running:

```bash
git init
git add .
git commit -m "Initial commit of Color Dash Blitz"
git branch -M main
git remote add origin <YOUR_REPOSITORY_URL>
git push -u origin main
```

## 🤖 Genkit Development

To explore and test the AI flows used for color facts, you can start the Genkit UI:

```bash
npm run genkit:dev
```

## 📄 License

This project is open-source and available under the MIT License.