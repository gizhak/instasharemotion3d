# InstaShareMotion3D

A 3D motion sharing platform for creating and sharing interactive 3D animations in the browser.

## Features

- 🎨 Interactive 3D animations powered by Three.js
- 🎮 Intuitive controls (play, pause, reset, speed adjustment)
- 📱 Responsive design that works on desktop and mobile
- 🔄 Orbital camera controls for viewing from any angle
- ⚡ Smooth animations with customizable speed

## Demo

The application features three animated 3D objects:
- A rotating cube
- A bouncing sphere
- An orbiting torus

All objects can be viewed from any angle using mouse/touch controls.

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Python 3 (for running the local development server)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/gizhak/instasharemotion3d.git
cd instasharemotion3d
```

2. Start the development server:
```bash
npm start
```

Or use Python directly:
```bash
python3 -m http.server 8000
```

3. Open your browser and navigate to:
```
http://localhost:8000
```

## Usage

### Camera Controls
- **Left Click + Drag**: Rotate the camera around the scene
- **Scroll Wheel**: Zoom in and out
- **Right Click + Drag**: Pan the camera

### Animation Controls
- **Play**: Start the animation
- **Pause**: Pause the animation
- **Reset**: Reset all objects and camera to initial positions
- **Speed Slider**: Adjust animation speed from 0.1x to 3.0x

## Project Structure

```
instasharemotion3d/
├── index.html          # Main HTML file
├── css/
│   └── style.css      # Stylesheet
├── js/
│   └── main.js        # Three.js animation logic
├── package.json       # Project metadata and dependencies
├── .gitignore        # Git ignore rules
└── README.md         # This file
```

## Technologies Used

- **Three.js**: 3D graphics library for WebGL
- **JavaScript (ES6+)**: Modern JavaScript with modules
- **HTML5 & CSS3**: Markup and styling
- **WebGL**: Hardware-accelerated 3D graphics

## Browser Support

This application works in all modern browsers that support:
- WebGL
- ES6 Modules
- Import Maps

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Future Enhancements

- [ ] Add ability to upload custom 3D models
- [ ] Implement social sharing features
- [ ] Add animation recording and export
- [ ] Create animation timeline editor
- [ ] Support for multiple scenes
- [ ] User authentication and profile pages