// environment-generator.js
// Procedurally generates trees, buildings, and simple traffic for the highway scene.

AFRAME.registerComponent('highway-environment', {
  schema: {
    length: { type: 'number', default: 500 },
    treeCount: { type: 'number', default: 100 },
    buildingCount: { type: 'number', default: 40 }
  },
  init: function () {
    const sceneEl = this.el.sceneEl;
    
    // Generate Trees
    for (let i = 0; i < this.data.treeCount; i++) {
      const zPos = (Math.random() * this.data.length) - (this.data.length / 2); // -250 to 250
      const isLeft = Math.random() > 0.5;
      const xPos = isLeft ? (-10 - Math.random() * 30) : (10 + Math.random() * 30);
      
      const tree = document.createElement('a-entity');
      tree.setAttribute('position', `${xPos} 0 ${zPos}`);
      
      // Trunk
      const trunk = document.createElement('a-cylinder');
      trunk.setAttribute('radius', '0.5');
      trunk.setAttribute('height', '3');
      trunk.setAttribute('color', '#5D4037');
      trunk.setAttribute('position', '0 1.5 0');
      tree.appendChild(trunk);
      
      // Leaves
      const leaves = document.createElement('a-cone');
      leaves.setAttribute('radius-bottom', '2');
      leaves.setAttribute('radius-top', '0');
      leaves.setAttribute('height', '4');
      leaves.setAttribute('color', '#2E7D32');
      leaves.setAttribute('position', '0 4.5 0');
      tree.appendChild(leaves);
      
      this.el.appendChild(tree);
    }

    // Generate Buildings
    for (let i = 0; i < this.data.buildingCount; i++) {
        const zPos = (Math.random() * this.data.length) - (this.data.length / 2);
        const isLeft = Math.random() > 0.5;
        // Place buildings further out than trees
        const xPos = isLeft ? (-30 - Math.random() * 30) : (30 + Math.random() * 30);
        
        const width = 10 + Math.random() * 15;
        const depth = 10 + Math.random() * 15;
        const height = 10 + Math.random() * 50; // Random heights
        
        const building = document.createElement('a-box');
        building.setAttribute('position', `${xPos} ${height/2} ${zPos}`);
        building.setAttribute('width', width);
        building.setAttribute('height', height);
        building.setAttribute('depth', depth);
        
        // Random grey/blue colors
        const color = ['#546E7A', '#78909C', '#455A64', '#37474F'][Math.floor(Math.random() * 4)];
        building.setAttribute('color', color);
        
        this.el.appendChild(building);
    }
  }
});

// Component for a moving traffic vehicle
AFRAME.registerComponent('traffic-vehicle', {
  schema: {
    speed: { type: 'number', default: 0.3 }, // Speed along Z axis
    resetZ: { type: 'number', default: -300 }, // When to disappear
    startZ: { type: 'number', default: 200 }   // Where to reappear
  },
  tick: function () {
    const pos = this.el.getAttribute('position');
    pos.z -= this.data.speed;
    
    // Loop back
    if (pos.z < this.data.resetZ) {
      pos.z = this.data.startZ + (Math.random() * 50); // slight randomness
    }
    
    this.el.setAttribute('position', pos);
  }
});

// Manager to spawn traffic
AFRAME.registerComponent('traffic-manager', {
  schema: {
    count: { type: 'number', default: 15 }
  },
  init: function () {
    const colors = ['#E74C3C', '#F1C40F', '#3498DB', '#9B59B6', '#FFFFFF', '#34495E'];
    const lanes = [-2.5, 2.5]; // Left lane and right lane
    
    for (let i = 0; i < this.data.count; i++) {
        const vehicle = document.createElement('a-entity');
        
        // Choose lane
        const laneX = lanes[Math.floor(Math.random() * lanes.length)];
        const startZ = -150 + Math.random() * 300;
        
        vehicle.setAttribute('position', `${laneX} 1 ${startZ}`);
        
        // Slightly random speed per vehicle
        const speed = 0.5 + Math.random() * 0.4;
        vehicle.setAttribute('traffic-vehicle', `speed: ${speed}; resetZ: -300; startZ: 200`);
        
        // Simple Car Mesh
        const chassis = document.createElement('a-box');
        chassis.setAttribute('width', '2');
        chassis.setAttribute('height', '1');
        chassis.setAttribute('depth', '4.5');
        chassis.setAttribute('color', colors[Math.floor(Math.random() * colors.length)]);
        vehicle.appendChild(chassis);

        const cab = document.createElement('a-box');
        cab.setAttribute('width', '1.8');
        cab.setAttribute('height', '0.7');
        cab.setAttribute('depth', '2.2');
        cab.setAttribute('position', '0 0.8 0.2');
        cab.setAttribute('color', '#222');
        vehicle.appendChild(cab);
        
        this.el.appendChild(vehicle);
    }
  }
});
