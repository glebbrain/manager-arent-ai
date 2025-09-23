const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

class SceneManager {
  constructor() {
    this.scenes = new Map();
    this.objects = new Map();
    this.lights = new Map();
    this.cameras = new Map();
    this.materials = new Map();
    this.textures = new Map();
  }

  async initialize() {
    try {
      logger.info('Initializing Scene Manager...');
      
      // Load existing data
      await this.loadSceneData();
      
      logger.info('Scene Manager initialized');
      return true;
    } catch (error) {
      logger.error('Failed to initialize Scene Manager:', error);
      throw error;
    }
  }

  async createScene(sceneData) {
    try {
      const sceneId = uuidv4();
      const scene = {
        sceneId,
        name: sceneData.name || 'New Scene',
        description: sceneData.description || '',
        type: sceneData.type || 'vr', // 'vr', 'ar', 'mixed'
        settings: {
          physics: sceneData.settings?.physics || true,
          lighting: sceneData.settings?.lighting || 'pbr',
          shadows: sceneData.settings?.shadows || true,
          fog: sceneData.settings?.fog || false,
          skybox: sceneData.settings?.skybox || null,
          gravity: sceneData.settings?.gravity || { x: 0, y: -9.81, z: 0 }
        },
        environment: {
          ambientLight: sceneData.environment?.ambientLight || { color: '#404040', intensity: 0.4 },
          background: sceneData.environment?.background || '#000000',
          fog: sceneData.environment?.fog || null
        },
        bounds: {
          min: sceneData.bounds?.min || { x: -100, y: -100, z: -100 },
          max: sceneData.bounds?.max || { x: 100, y: 100, z: 100 }
        },
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: sceneData.createdBy || 'system',
        version: '1.0.0'
      };

      this.scenes.set(sceneId, scene);
      await this.saveScenes();

      logger.info(`Scene created: ${sceneId}`);
      
      return {
        success: true,
        sceneId,
        ...scene
      };
    } catch (error) {
      logger.error(`Failed to create scene:`, error);
      throw error;
    }
  }

  async addObject(objectData) {
    try {
      const objectId = uuidv4();
      const object = {
        objectId,
        sceneId: objectData.sceneId,
        name: objectData.name || 'Object',
        type: objectData.type || 'mesh', // 'mesh', 'light', 'camera', 'audio', 'particle'
        assetId: objectData.assetId || null,
        position: objectData.position || { x: 0, y: 0, z: 0 },
        rotation: objectData.rotation || { x: 0, y: 0, z: 0 },
        scale: objectData.scale || { x: 1, y: 1, z: 1 },
        visible: objectData.visible !== false,
        interactive: objectData.interactive || false,
        physics: objectData.physics || {
          enabled: false,
          mass: 1,
          friction: 0.5,
          restitution: 0.3,
          shape: 'box'
        },
        materials: objectData.materials || [],
        animations: objectData.animations || [],
        metadata: objectData.metadata || {},
        createdAt: new Date().toISOString()
      };

      this.objects.set(objectId, object);
      await this.saveObjects();

      logger.info(`Object added to scene: ${objectId}`);
      
      return {
        success: true,
        objectId,
        ...object
      };
    } catch (error) {
      logger.error(`Failed to add object to scene:`, error);
      throw error;
    }
  }

  async updateObject(objectId, updateData) {
    try {
      const object = this.objects.get(objectId);
      if (!object) {
        throw new Error(`Object not found: ${objectId}`);
      }

      object.position = updateData.position || object.position;
      object.rotation = updateData.rotation || object.rotation;
      object.scale = updateData.scale || object.scale;
      object.visible = updateData.visible !== undefined ? updateData.visible : object.visible;
      object.interactive = updateData.interactive !== undefined ? updateData.interactive : object.interactive;
      object.physics = { ...object.physics, ...(updateData.physics || {}) };
      object.materials = updateData.materials || object.materials;
      object.animations = updateData.animations || object.animations;
      object.metadata = { ...object.metadata, ...(updateData.metadata || {}) };
      object.updatedAt = new Date().toISOString();
      
      this.objects.set(objectId, object);
      await this.saveObjects();

      return {
        success: true,
        objectId,
        ...object
      };
    } catch (error) {
      logger.error(`Failed to update object ${objectId}:`, error);
      throw error;
    }
  }

  async removeObject(objectId) {
    try {
      const object = this.objects.get(objectId);
      if (!object) {
        throw new Error(`Object not found: ${objectId}`);
      }

      this.objects.delete(objectId);
      await this.saveObjects();

      logger.info(`Object removed from scene: ${objectId}`);
      
      return {
        success: true,
        objectId
      };
    } catch (error) {
      logger.error(`Failed to remove object ${objectId}:`, error);
      throw error;
    }
  }

  async addLight(lightData) {
    try {
      const lightId = uuidv4();
      const light = {
        lightId,
        sceneId: lightData.sceneId,
        type: lightData.type || 'directional', // 'directional', 'point', 'spot', 'ambient'
        position: lightData.position || { x: 0, y: 10, z: 0 },
        rotation: lightData.rotation || { x: 0, y: 0, z: 0 },
        color: lightData.color || '#ffffff',
        intensity: lightData.intensity || 1.0,
        range: lightData.range || 100,
        angle: lightData.angle || Math.PI / 3,
        penumbra: lightData.penumbra || 0.1,
        castShadow: lightData.castShadow || false,
        visible: lightData.visible !== false,
        createdAt: new Date().toISOString()
      };

      this.lights.set(lightId, light);
      await this.saveLights();

      logger.info(`Light added to scene: ${lightId}`);
      
      return {
        success: true,
        lightId,
        ...light
      };
    } catch (error) {
      logger.error(`Failed to add light to scene:`, error);
      throw error;
    }
  }

  async addCamera(cameraData) {
    try {
      const cameraId = uuidv4();
      const camera = {
        cameraId,
        sceneId: cameraData.sceneId,
        type: cameraData.type || 'perspective', // 'perspective', 'orthographic', 'vr', 'ar'
        position: cameraData.position || { x: 0, y: 1.6, z: 0 },
        rotation: cameraData.rotation || { x: 0, y: 0, z: 0 },
        fov: cameraData.fov || 75,
        near: cameraData.near || 0.1,
        far: cameraData.far || 1000,
        aspect: cameraData.aspect || 16/9,
        active: cameraData.active || false,
        vr: cameraData.vr || false,
        ar: cameraData.ar || false,
        createdAt: new Date().toISOString()
      };

      this.cameras.set(cameraId, camera);
      await this.saveCameras();

      logger.info(`Camera added to scene: ${cameraId}`);
      
      return {
        success: true,
        cameraId,
        ...camera
      };
    } catch (error) {
      logger.error(`Failed to add camera to scene:`, error);
      throw error;
    }
  }

  async createMaterial(materialData) {
    try {
      const materialId = uuidv4();
      const material = {
        materialId,
        name: materialData.name || 'Material',
        type: materialData.type || 'standard', // 'standard', 'pbr', 'phong', 'lambert'
        properties: {
          color: materialData.properties?.color || '#ffffff',
          metalness: materialData.properties?.metalness || 0.0,
          roughness: materialData.properties?.roughness || 0.5,
          emissive: materialData.properties?.emissive || '#000000',
          emissiveIntensity: materialData.properties?.emissiveIntensity || 0.0,
          opacity: materialData.properties?.opacity || 1.0,
          transparent: materialData.properties?.transparent || false,
          side: materialData.properties?.side || 'front' // 'front', 'back', 'double'
        },
        textures: {
          map: materialData.textures?.map || null,
          normalMap: materialData.textures?.normalMap || null,
          roughnessMap: materialData.textures?.roughnessMap || null,
          metalnessMap: materialData.textures?.metalnessMap || null,
          emissiveMap: materialData.textures?.emissiveMap || null,
          aoMap: materialData.textures?.aoMap || null
        },
        createdAt: new Date().toISOString()
      };

      this.materials.set(materialId, material);
      await this.saveMaterials();

      logger.info(`Material created: ${materialId}`);
      
      return {
        success: true,
        materialId,
        ...material
      };
    } catch (error) {
      logger.error(`Failed to create material:`, error);
      throw error;
    }
  }

  async getSceneObjects(sceneId) {
    try {
      const objects = [];
      
      for (const [objectId, object] of this.objects.entries()) {
        if (object.sceneId === sceneId) {
          objects.push({
            objectId: object.objectId,
            name: object.name,
            type: object.type,
            assetId: object.assetId,
            position: object.position,
            rotation: object.rotation,
            scale: object.scale,
            visible: object.visible,
            interactive: object.interactive,
            physics: object.physics,
            materials: object.materials,
            animations: object.animations,
            metadata: object.metadata,
            createdAt: object.createdAt
          });
        }
      }

      return {
        success: true,
        sceneId,
        objects: objects,
        count: objects.length
      };
    } catch (error) {
      logger.error(`Failed to get objects for scene ${sceneId}:`, error);
      throw error;
    }
  }

  async getSceneLights(sceneId) {
    try {
      const lights = [];
      
      for (const [lightId, light] of this.lights.entries()) {
        if (light.sceneId === sceneId) {
          lights.push({
            lightId: light.lightId,
            type: light.type,
            position: light.position,
            rotation: light.rotation,
            color: light.color,
            intensity: light.intensity,
            range: light.range,
            angle: light.angle,
            penumbra: light.penumbra,
            castShadow: light.castShadow,
            visible: light.visible,
            createdAt: light.createdAt
          });
        }
      }

      return {
        success: true,
        sceneId,
        lights: lights,
        count: lights.length
      };
    } catch (error) {
      logger.error(`Failed to get lights for scene ${sceneId}:`, error);
      throw error;
    }
  }

  async getSceneInfo(sceneId) {
    try {
      const scene = this.scenes.get(sceneId);
      if (!scene) {
        throw new Error(`Scene not found: ${sceneId}`);
      }

      const objects = await this.getSceneObjects(sceneId);
      const lights = await this.getSceneLights(sceneId);

      return {
        success: true,
        sceneId: scene.sceneId,
        name: scene.name,
        description: scene.description,
        type: scene.type,
        settings: scene.settings,
        environment: scene.environment,
        bounds: scene.bounds,
        status: scene.status,
        createdAt: scene.createdAt,
        createdBy: scene.createdBy,
        version: scene.version,
        objects: objects.objects,
        lights: lights.lights
      };
    } catch (error) {
      logger.error(`Failed to get scene info for ${sceneId}:`, error);
      throw error;
    }
  }

  async listScenes() {
    try {
      const scenesList = [];
      
      for (const [sceneId, scene] of this.scenes.entries()) {
        scenesList.push({
          sceneId: scene.sceneId,
          name: scene.name,
          description: scene.description,
          type: scene.type,
          status: scene.status,
          createdAt: scene.createdAt,
          createdBy: scene.createdBy,
          version: scene.version
        });
      }

      return {
        success: true,
        scenes: scenesList,
        count: scenesList.length
      };
    } catch (error) {
      logger.error('Failed to list scenes:', error);
      throw error;
    }
  }

  async updateScene(sceneId, updateData) {
    try {
      const scene = this.scenes.get(sceneId);
      if (!scene) {
        throw new Error(`Scene not found: ${sceneId}`);
      }

      scene.name = updateData.name || scene.name;
      scene.description = updateData.description || scene.description;
      scene.settings = { ...scene.settings, ...(updateData.settings || {}) };
      scene.environment = { ...scene.environment, ...(updateData.environment || {}) };
      scene.bounds = { ...scene.bounds, ...(updateData.bounds || {}) };
      scene.updatedAt = new Date().toISOString();
      scene.version = this.incrementVersion(scene.version);
      
      this.scenes.set(sceneId, scene);
      await this.saveScenes();

      return {
        success: true,
        sceneId,
        ...scene
      };
    } catch (error) {
      logger.error(`Failed to update scene ${sceneId}:`, error);
      throw error;
    }
  }

  async cleanupUser(userId) {
    try {
      // This would clean up user-specific scene data
      // Implementation depends on specific requirements
      logger.info(`Cleaned up scene data for user ${userId}`);
    } catch (error) {
      logger.error(`Failed to cleanup scene data for user ${userId}:`, error);
    }
  }

  incrementVersion(version) {
    const parts = version.split('.');
    const patch = parseInt(parts[2]) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  async loadSceneData() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      
      // Load scenes
      const scenesPath = path.join(dataDir, 'scenes.json');
      if (fs.existsSync(scenesPath)) {
        const data = fs.readFileSync(scenesPath, 'utf8');
        const scenes = JSON.parse(data);
        for (const [key, sceneData] of Object.entries(scenes)) {
          this.scenes.set(key, sceneData);
        }
      }
      
      // Load objects
      const objectsPath = path.join(dataDir, 'scene-objects.json');
      if (fs.existsSync(objectsPath)) {
        const data = fs.readFileSync(objectsPath, 'utf8');
        const objects = JSON.parse(data);
        for (const [key, objectData] of Object.entries(objects)) {
          this.objects.set(key, objectData);
        }
      }
      
      // Load lights
      const lightsPath = path.join(dataDir, 'scene-lights.json');
      if (fs.existsSync(lightsPath)) {
        const data = fs.readFileSync(lightsPath, 'utf8');
        const lights = JSON.parse(data);
        for (const [key, lightData] of Object.entries(lights)) {
          this.lights.set(key, lightData);
        }
      }
      
      // Load cameras
      const camerasPath = path.join(dataDir, 'scene-cameras.json');
      if (fs.existsSync(camerasPath)) {
        const data = fs.readFileSync(camerasPath, 'utf8');
        const cameras = JSON.parse(data);
        for (const [key, cameraData] of Object.entries(cameras)) {
          this.cameras.set(key, cameraData);
        }
      }
      
      // Load materials
      const materialsPath = path.join(dataDir, 'materials.json');
      if (fs.existsSync(materialsPath)) {
        const data = fs.readFileSync(materialsPath, 'utf8');
        const materials = JSON.parse(data);
        for (const [key, materialData] of Object.entries(materials)) {
          this.materials.set(key, materialData);
        }
      }
      
      logger.info(`Loaded scene data: ${this.scenes.size} scenes, ${this.objects.size} objects, ${this.lights.size} lights, ${this.cameras.size} cameras, ${this.materials.size} materials`);
    } catch (error) {
      logger.error('Failed to load scene data:', error);
    }
  }

  async saveScenes() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const scenesPath = path.join(dataDir, 'scenes.json');
      const scenesObj = Object.fromEntries(this.scenes);
      fs.writeFileSync(scenesPath, JSON.stringify(scenesObj, null, 2));
    } catch (error) {
      logger.error('Failed to save scenes:', error);
    }
  }

  async saveObjects() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const objectsPath = path.join(dataDir, 'scene-objects.json');
      const objectsObj = Object.fromEntries(this.objects);
      fs.writeFileSync(objectsPath, JSON.stringify(objectsObj, null, 2));
    } catch (error) {
      logger.error('Failed to save objects:', error);
    }
  }

  async saveLights() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const lightsPath = path.join(dataDir, 'scene-lights.json');
      const lightsObj = Object.fromEntries(this.lights);
      fs.writeFileSync(lightsPath, JSON.stringify(lightsObj, null, 2));
    } catch (error) {
      logger.error('Failed to save lights:', error);
    }
  }

  async saveCameras() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const camerasPath = path.join(dataDir, 'scene-cameras.json');
      const camerasObj = Object.fromEntries(this.cameras);
      fs.writeFileSync(camerasPath, JSON.stringify(camerasObj, null, 2));
    } catch (error) {
      logger.error('Failed to save cameras:', error);
    }
  }

  async saveMaterials() {
    try {
      const dataDir = path.join(__dirname, '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const materialsPath = path.join(dataDir, 'materials.json');
      const materialsObj = Object.fromEntries(this.materials);
      fs.writeFileSync(materialsPath, JSON.stringify(materialsObj, null, 2));
    } catch (error) {
      logger.error('Failed to save materials:', error);
    }
  }

  async cleanup() {
    try {
      await this.saveScenes();
      await this.saveObjects();
      await this.saveLights();
      await this.saveCameras();
      await this.saveMaterials();
      this.scenes.clear();
      this.objects.clear();
      this.lights.clear();
      this.cameras.clear();
      this.materials.clear();
      logger.info('Scene Manager cleaned up');
    } catch (error) {
      logger.error('Error during cleanup:', error);
    }
  }
}

module.exports = new SceneManager();
