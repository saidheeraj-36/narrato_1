# MarketNarrator AI Suite

MarketNarrator AI is a fully-functional GenAI marketing workspace designed for MBA-grade presentations and real-world pilots. It combines persona crafting, campaign orchestration, content scheduling, performance forecasting, market listening, and a Gemini-powered strategist chatbot inside a single zero-code deployable experience.

## ✨ Highlights

- **Marketing-first**: Everything is built around marketing workflows (personas, campaigns, listening, metrics).
- **Gemini-ready**: Plug in a Google Gemini API key to unlock AI co-creation across the workspace.
- **No-code friendly**: Pure HTML/CSS/JS, deployable on Netlify, Vercel, or GitHub Pages without build steps.
- **Impact-focused**: Includes launch checklist, metrics tracker, and testimonial vault to evidence adoption.
- **User-centric UX**: Responsive layout, smooth navigation, and inline guidance for every tool.

## 🚀 Getting Started

1. **Clone / Download** this repository.
2. **Open `index.html`** in your browser, or deploy the folder to a static host (Netlify, Vercel, GitHub Pages).
3. **Add your Gemini API key** in the Project Mission Canvas card to enable AI features.
   - Your key is stored locally in the browser and never sent to any server other than Google.
4. Explore the modules:
   - Persona Lab
   - Campaign Studio
   - Content Calendar (drag-and-drop + CSV export)
   - Performance Simulator & Voice of Market
   - Gemini Marketing Strategist chatbot
   - Impact & Validation Hub (checklist, charts, testimonials)

## 🧠 Gemini Integration Notes

- MarketNarrator uses the free `gemini-1.5-flash` endpoint via the REST API.
- All AI-enabled actions fall back to handcrafted heuristics when an API key is missing or if the request fails.
- Update `scripts/app.js` if you want to experiment with different models or prompt styles.

## 📊 Data Persistence

- The Gemini API key and feedback testimonials are saved in `localStorage` so refreshes keep your context.
- Clear the browser storage or open in incognito mode to reset.

## 🛠 Customisation Guide

- **Branding**: Update colors in `styles.css` under the `:root` section.
- **Copy & Sections**: Modify `index.html` to tailor messaging for your specific SaaS positioning.
- **Feature Enhancements**: Extend the modular functions inside `scripts/app.js` to connect to real data sources.

## ✅ Evaluation Checklist Support

- Built-in checklist helps track the academic grading requirements.
- Charts and testimonial exports make it easy to evidence adoption metrics.

## 📄 License

Released for academic use. Adapt freely for demos, prototypes, or coursework presentations.
