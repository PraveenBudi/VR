// environment-generator.js
// Procedurally generates a gigantic City Track Loop with physical boundaries.

window.obstacles = [];

AFRAME.registerComponent('city-track-generator', {
  init: function () {
    const trackSize = 500; // 500m x 500m square loop
    const roadWidth = 16;
    
    // Add grass
    let grass = document.createElement('a-plane');
    grass.setAttribute('rotation', '-90 0 0');
    grass.setAttribute('width', '2000');
    grass.setAttribute('height', '2000');
    grass.setAttribute('color', '#27AE60');
    grass.setAttribute('material', 'roughness: 1');
    this.el.appendChild(grass);

    // Build South Straight
    this.createRoadSegment(0, 0, trackSize - 40, roadWidth);
    // Build North Straight
    this.createRoadSegment(0, -trackSize, trackSize - 40, roadWidth);
    // Build West Straight
    this.createRoadSegment(-trackSize/2, -trackSize/2, roadWidth, trackSize - 40);
    // Build East Straight
    this.createRoadSegment(trackSize/2, -trackSize/2, roadWidth, trackSize - 40);

    // Build 4 Intersections/Corners (using planes for performance blocky city)
    this.createRoadSegment(-trackSize/2, 0, roadWidth, roadWidth);
    this.createRoadSegment(trackSize/2, 0, roadWidth, roadWidth);
    this.createRoadSegment(-trackSize/2, -trackSize, roadWidth, roadWidth);
    this.createRoadSegment(trackSize/2, -trackSize, roadWidth, roadWidth);

    // Create solid boundary walls so the user gets blocked if they go off road!
    this.createCollisionWall(-trackSize/2 + roadWidth/2, -trackSize/2, 1, trackSize); // Inner West
    this.createCollisionWall(trackSize/2 - roadWidth/2, -trackSize/2, 1, trackSize);  // Inner East
    this.createCollisionWall(0, -roadWidth/2, trackSize, 1);                          // Inner South
    this.createCollisionWall(0, -trackSize + roadWidth/2, trackSize, 1);              // Inner North

    this.createCollisionWall(-trackSize/2 - roadWidth/2, -trackSize/2, 1, trackSize); // Outer West
    this.createCollisionWall(trackSize/2 + roadWidth/2, -trackSize/2, 1, trackSize);  // Outer East
    this.createCollisionWall(0, roadWidth/2, trackSize, 1);                           // Outer South
    this.createCollisionWall(0, -trackSize - roadWidth/2, trackSize, 1);              // Outer North

    // Populate City Buildings Randomly
    this.spawnBuildings(trackSize);
  },

  createRoadSegment: function(x, z, w, d) {
      let road = document.createElement('a-plane');
      road.setAttribute('position', `${x} 0.05 ${z}`);
      road.setAttribute('rotation', '-90 0 0');
      road.setAttribute('width', w);
      road.setAttribute('height', d);
      road.setAttribute('color', '#333333');
      this.el.appendChild(road);

      // Add center dashed lines if it's a long straight
      if (w > d) {
          let line = document.createElement('a-plane');
          line.setAttribute('position', `${x} 0.06 ${z}`);
          line.setAttribute('rotation', '-90 0 0');
          line.setAttribute('width', w);
          line.setAttribute('height', 0.2);
          line.setAttribute('color', '#fff');
          this.el.appendChild(line);
      } else if (d > w) {
          let line = document.createElement('a-plane');
          line.setAttribute('position', `${x} 0.06 ${z}`);
          line.setAttribute('rotation', '-90 0 0');
          line.setAttribute('width', 0.2);
          line.setAttribute('height', d);
          line.setAttribute('color', '#fff');
          this.el.appendChild(line);
      }
  },

  createCollisionWall: function(x, z, w, d) {
      let wall = document.createElement('a-box');
      wall.setAttribute('position', `${x} 2 ${z}`);
      wall.setAttribute('width', w);
      wall.setAttribute('height', 4);
      wall.setAttribute('depth', d);
      wall.setAttribute('color', '#000');
      wall.setAttribute('opacity', '0'); // Invisible, just for collision
      this.el.appendChild(wall);

      // Register boundary to global obstacle list for the vehicle to check
      window.obstacles.push({
          minX: x - w/2, maxX: x + w/2,
          minZ: z - d/2, maxZ: z + d/2
      });
  },

  spawnBuildings: function(tSize) {
      const colors = ['#2C3E50', '#8E44AD', '#2980B9', '#16A085', '#E67E22', '#D35400', '#C0392B', '#BDC3C7', '#7F8C8D'];
      
      for(let i=0; i<300; i++) {
          let bx = (Math.random() * 1000) - 500;
          let bz = (Math.random() * 1000) - 500;

          // Don't spawn on the road
          if (Math.abs(bx) > (tSize/2 - 20) && Math.abs(bx) < (tSize/2 + 20)) continue;
          if (Math.abs(bz) > (tSize/2 - 20) && Math.abs(bz) < (tSize/2 + 20)) continue;
          if (Math.abs(bz) < 20) continue; // South road

          let bw = 10 + Math.random() * 30;
          let bd = 10 + Math.random() * 30;
          let bh = 15 + Math.random() * 150; // Skyscapers

          let bldg = document.createElement('a-box');
          bldg.setAttribute('position', `${bx} ${bh/2} ${bz}`);
          bldg.setAttribute('width', bw);
          bldg.setAttribute('height', bh);
          bldg.setAttribute('depth', bd);
          // 80% chance of standard glass/metal color, 20% random
          let myColor = Math.random() > 0.2 ? ['#afc6d6', '#3b434a', '#859c94'][Math.floor(Math.random()*3)] : colors[Math.floor(Math.random()*colors.length)];
          bldg.setAttribute('color', myColor);
          bldg.setAttribute('material', 'metalness: 0.6; roughness: 0.3');
          
          this.el.appendChild(bldg);

          // Add to obstacles
          window.obstacles.push({
              minX: bx - bw/2, maxX: bx + bw/2,
              minZ: bz - bd/2, maxZ: bz + bd/2
          });
      }
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
