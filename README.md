# Investment Growth Calculator

A React-based financial simulation tool that allows users to model investment growth scenarios with various market conditions, crises, and recovery patterns.

## ⚠️ Disclaimer

This tool is for **educational and illustrative purposes only**. 

- This is NOT financial advice
- Past performance does not predict future results
- All simulations are hypothetical and do not guarantee any specific returns
- Market behavior is complex and cannot be fully captured by any simulation
- Always consult with qualified financial professionals for investment advice
- Real investment outcomes may differ significantly from simulated scenarios
- Do not make investment decisions based solely on this tool

The creators and contributors of this tool:
- Are not financial advisors
- Make no guarantees about the accuracy of the simulations
- Are not responsible for any investment decisions made using this tool
- Recommend thorough research and professional consultation before making any investment decisions

## Features

- Model multiple asset growth trajectories
- Simulate market crises with customizable parameters
- Adjust for inflation and fees
- Visualize different recovery patterns (V, U, L shaped)
- Add custom assets with unique characteristics
- Real-time graph updates
- Summary metrics for each asset

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd financial-sim
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to:
```
http://localhost:5173
```

## Project Structure

- `src/InvestmentGrowthCalculator.jsx` - Main component with simulation logic
- `src/components/ui/` - UI components (cards, inputs, buttons, etc.)

## Dependencies

- React 18
- Vite (for development and building)
- Recharts (for charts)
- Lucide React (for icons)
- TailwindCSS (for styling)

## Development

To modify the simulation parameters or add new features:

1. Asset properties can be adjusted in the `defaultAssets` object
2. Crisis scenarios can be modified in the `scenarioPresets` object
3. Simulation logic is in the `scenarioData` useMemo hook

## Building for Production

To create a production build:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - feel free to use this code for any purpose. 