// vr-scene.js
// Maps VR controller thumbsticks/triggers to virtual inputs for the vehicle.

window.virtualInputs = {
    accelerator: 0,
    brake: 0,
    steering: 0
};

// Component for the Right Controller (Acceleration and Braking via Trigger/Grip)
AFRAME.registerComponent('vr-pedals', {
  init: function () {
    this.el.addEventListener('triggerdown', () => { window.virtualInputs.accelerator = 1; });
    this.el.addEventListener('triggerup', () => { window.virtualInputs.accelerator = 0; });
    
    this.el.addEventListener('gripdown', () => { window.virtualInputs.brake = 1; });
    this.el.addEventListener('gripup', () => { window.virtualInputs.brake = 0; });
  }
});

// Component for the Left Controller (Steering via Thumbstick)
AFRAME.registerComponent('vr-steering', {
  init: function () {
    this.el.addEventListener('thumbstickmoved', this.onThumbstickMoved.bind(this));
  },
  onThumbstickMoved: function (evt) {
    // evt.detail.x ranges from -1 (left) to 1 (right)
    window.virtualInputs.steering = evt.detail.x;
  }
});
