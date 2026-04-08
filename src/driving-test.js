// driving-test.js
// Handles logic for the driving license test (collisions, score, pass/fail)

AFRAME.registerComponent('driving-test-manager', {
  init: function () {
    this.score = 100;
    this.faults = 0;
    this.statusEl = document.querySelector('#test-status');
    
    this.updateStatus('Test Started. Follow the course. Avoid cones!');
    
    // Listen for collisions globally (assuming A-Frame physics or simple distance checks)
    // For this prototype, we'll use a simple distance check in the tick if we want, 
    // or rely on a custom event fired by obstacles.
    this.el.addEventListener('collided-with-obstacle', (evt) => {
      this.handleFault(evt.detail.penalty, evt.detail.reason);
    });
  },
  
  handleFault: function (penalty, reason) {
    this.score -= penalty;
    this.faults += 1;
    
    if (this.score <= 0) {
      this.updateStatus(`TEST FAILED. Too many faults. Reason: ${reason}`, 'red');
      // Stop vehicle
      const vehicle = document.querySelector('[vehicle-physics]');
      if (vehicle) vehicle.removeAttribute('vehicle-physics');
    } else {
      this.updateStatus(`Fault: ${reason} (-${penalty} pts). Score: ${this.score}`, 'orange');
    }
  },
  
  updateStatus: function (message, color = 'white') {
    if (!this.statusEl) return;
    this.statusEl.setAttribute('value', message);
    this.statusEl.setAttribute('color', color);
  }
});

// Component to attach to obstacles like cones
AFRAME.registerComponent('obstacle', {
  schema: {
    penalty: { type: 'number', default: 10 },
    reason: { type: 'string', default: 'Hit an obstacle' }
  },
  tick: function () {
    // Simple distance check to the player's vehicle
    const player = document.querySelector('#vehicle');
    if (!player) return;
    
    const pPos = player.getAttribute('position');
    const myPos = this.el.getAttribute('position');
    
    // Calculate distance (ignoring Y for simplicity)
    const dx = pPos.x - myPos.x;
    const dz = pPos.z - myPos.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    // If very close to the cone (e.g. radius of 1 meter)
    if (distance < 1.5 && !this.hit) {
      this.hit = true; // prevent multiple hits
      this.el.setAttribute('color', 'red'); // visual cue
      
      const manager = document.querySelector('[driving-test-manager]');
      if (manager) {
        manager.emit('collided-with-obstacle', { penalty: this.data.penalty, reason: this.data.reason });
      }
    }
  }
});
