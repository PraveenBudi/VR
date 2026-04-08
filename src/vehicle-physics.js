// vehicle-physics.js
// Handles the movement of the vehicle based on input.

AFRAME.registerComponent('vehicle-physics', {
  schema: {
    maxSpeed: { type: 'number', default: 0.5 },
    acceleration: { type: 'number', default: 0.01 },
    deceleration: { type: 'number', default: 0.005 },
    turnSpeed: { type: 'number', default: 2.0 },
    vehicleType: { type: 'string', default: 'car' } // car, bike, heavy
  },

  init: function () {
    this.speed = 0;
    this.keys = {};
    this.steerAngle = 0; // for visual steering wheel
    
    // Keyboard fallback for desktop testing
    window.addEventListener('keydown', (e) => { this.keys[e.code] = true; });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
  },

  tick: function (time, timeDelta) {
    let accelerate = this.keys['ArrowUp'] || this.keys['KeyW'];
    let brake = this.keys['ArrowDown'] || this.keys['KeyS'];
    let turnLeft = this.keys['ArrowLeft'] || this.keys['KeyA'];
    let turnRight = this.keys['ArrowRight'] || this.keys['KeyD'];

    let steerInput = 0;

    // Check VR inputs from a generic state (can be set by VR controllers later)
    if (window.virtualInputs) {
        accelerate = accelerate || window.virtualInputs.accelerator > 0;
        brake = brake || window.virtualInputs.brake > 0;
        
        if (window.virtualInputs.steering < -0.1) {
            turnLeft = true;
            steerInput = window.virtualInputs.steering;
        } else if (window.virtualInputs.steering > 0.1) {
            turnRight = true;
            steerInput = window.virtualInputs.steering;
        }
    }

    if (steerInput === 0) {
        if (turnLeft) steerInput = -1;
        if (turnRight) steerInput = 1;
    }

    // Handle acceleration
    if (accelerate) {
      if (this.data.vehicleType === 'heavy') {
          this.speed += this.data.acceleration * 0.5;
      } else {
          this.speed += this.data.acceleration;
      }
    } else if (brake) {
      if (this.data.vehicleType === 'heavy') {
          this.speed -= this.data.deceleration; // Stronger braking than natural
      } else {
          this.speed -= this.data.deceleration * 3; // Much stronger brakes
      }
    } else {
      // Natural deceleration (friction)
      if (this.speed > 0) this.speed -= this.data.deceleration;
      if (this.speed < 0) this.speed += this.data.deceleration;
    }

    // Clamp speed
    this.speed = Math.max(-0.2, Math.min(this.speed, this.data.maxSpeed));
    if (Math.abs(this.speed) < 0.001) this.speed = 0;

    // Handle turning based on input AND current speed (can't turn fully when stationary)
    let rotation = this.el.getAttribute('rotation');
    if (this.speed !== 0 || steerInput !== 0) {
      // Scale turn speed based on how fast we are going (easier to handle)
      let speedFactor = Math.abs(this.speed) > 0 ? 0.3 + (Math.abs(this.speed) / this.data.maxSpeed)*0.7 : 0.1;
      let turnAmount = this.data.turnSpeed * speedFactor * Math.abs(steerInput);
      
      if (this.data.vehicleType === 'heavy') turnAmount *= 0.5; // Wider turns
      if (this.data.vehicleType === 'bike') turnAmount *= 1.5; // Sharper turns

      // If reversing, invert steering direction intuitively
      let directionMultiplier = this.speed >= 0 ? 1 : -1;

      if (turnLeft) rotation.y += turnAmount * directionMultiplier;
      if (turnRight) rotation.y -= turnAmount * directionMultiplier;
      this.el.setAttribute('rotation', rotation);
    }

    // Update visual steering wheel rotation
    this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, steerInput * -90, 0.1);
    const sqlWheels = document.querySelectorAll('.steering-wheel'); // Use class to support multiple scenes
    sqlWheels.forEach(wheel => {
         wheel.setAttribute('rotation', `0 0 ${this.steerAngle}`);
    });

    // Apply movement
    if (this.speed !== 0) {
      let position = this.el.getAttribute('position');
      let angle = THREE.MathUtils.degToRad(rotation.y);
      position.x += Math.sin(angle) * this.speed;
      position.z += Math.cos(angle) * this.speed;
      this.el.setAttribute('position', position);
    }

    // Dispatch telemetry event for 2D game HUD overlays
    let gear = 'P';
    if (this.speed > 0.01) gear = 'D';
    else if (this.speed < -0.01) gear = 'R';
    else if (accelerate || brake) gear = 'N';

    // Cap display speed visually at 150 kmph
    let displaySpeed = Math.round(Math.abs(this.speed) * 200);
    if (displaySpeed > 150) displaySpeed = 150;

    const telemetryEvent = new CustomEvent('vehicle-telemetry', {
       detail: { speed: displaySpeed, gear: gear, steering: Math.round(steerInput * 100) }
    });
    window.dispatchEvent(telemetryEvent);
  }
});
