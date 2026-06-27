# Changelog

All notable changes to the Color Dash Blitz project will be documented in this file.

## [0.2.0] - 2024-05-22

### Added
- **Difficulty Scaling**: Introduced 3 new levels of difficulty. The game now scales from 3 to 12 color choices with an accelerating timer based on the user's score.
- **Yandex Games SDK Integration**:
    - Full-screen ad support with smart frequency logic.
    - Global leaderboard submission for high scores.
    - Remote Config support for toggling AI facts and adjusting game balance.
- **Audio System**: Implemented sound effects for Game Start, Correct Match, Wrong Match, and Game Over.
- **Static Export**: Configured Next.js for `output: 'export'` to support serverless hosting environments like Yandex Games.

### Fixed
- **Level Generation**: Fixed a bug where the correct answer could occasionally be missing from choices by implementing atomic state updates.
- **UI Responsiveness**: Optimized the layout for smartphone portrait orientation, ensuring a no-scroll experience on small screens using dynamic height units (`dvh`).
- **Color Pool**: Resolved an issue with duplicate hex codes in the color definitions.

### Improved
- **Multilingual Support**: Enhanced English and Russian translations for all UI elements and color names.
- **Visual Feedback**: Added bounce and shake animations for correct and wrong answers.

## [0.1.0] - 2024-05-20

### Added
- Initial project structure with Next.js 15 and ShadCN UI.
- Basic color matching gameplay loop.
- AI-powered color facts using Genkit and Google Gemini.
- Background music with mute toggle.
