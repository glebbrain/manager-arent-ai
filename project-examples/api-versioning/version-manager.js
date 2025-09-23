/**
 * API Versioning Manager
 * Handles API versioning for ManagerAgentAI services
 */

class VersionManager {
    constructor(options = {}) {
        this.defaultVersion = options.defaultVersion || 'v1';
        this.supportedVersions = options.supportedVersions || ['v1', 'v2', 'v3', 'v4'];
        this.versioningStrategy = options.versioningStrategy || 'header'; // header, path, query, accept
        this.deprecatedVersions = options.deprecatedVersions || [];
        this.supportedStrategies = ['header', 'path', 'query', 'accept'];
        
        this.versionConfigs = new Map();
        this.middleware = this.createMiddleware();
    }

    /**
     * Register version configuration
     */
    registerVersion(version, config) {
        if (!this.supportedVersions.includes(version)) {
            throw new Error(`Version ${version} is not supported`);
        }

        this.versionConfigs.set(version, {
            version,
            endpoints: config.endpoints || {},
            middleware: config.middleware || [],
            deprecated: this.deprecatedVersions.includes(version),
            deprecationDate: config.deprecationDate || null,
            sunsetDate: config.sunsetDate || null,
            changelog: config.changelog || [],
            ...config
        });
    }

    /**
     * Create versioning middleware
     */
    createMiddleware() {
        return (req, res, next) => {
            try {
                const version = this.extractVersion(req);
                const versionConfig = this.getVersionConfig(version);
                
                // Set version in request
                req.apiVersion = version;
                req.versionConfig = versionConfig;
                
                // Check if version is deprecated
                if (versionConfig.deprecated) {
                    this.addDeprecationWarning(res, version, versionConfig);
                }
                
                // Check if version is sunset
                if (versionConfig.sunsetDate && new Date() > new Date(versionConfig.sunsetDate)) {
                    return this.handleSunsetVersion(res, version, versionConfig);
                }
                
                // Apply version-specific middleware
                this.applyVersionMiddleware(req, res, next, versionConfig);
                
            } catch (error) {
                this.handleVersionError(res, error);
            }
        };
    }

    /**
     * Extract version from request
     */
    extractVersion(req) {
        switch (this.versioningStrategy) {
            case 'header':
                return this.extractFromHeader(req);
            case 'path':
                return this.extractFromPath(req);
            case 'query':
                return this.extractFromQuery(req);
            case 'accept':
                return this.extractFromAccept(req);
            default:
                throw new Error(`Unsupported versioning strategy: ${this.versioningStrategy}`);
        }
    }

    /**
     * Extract version from header
     */
    extractFromHeader(req) {
        const versionHeader = req.headers['api-version'] || req.headers['x-api-version'];
        if (versionHeader) {
            return this.normalizeVersion(versionHeader);
        }
        return this.defaultVersion;
    }

    /**
     * Extract version from path
     */
    extractFromPath(req) {
        const pathMatch = req.path.match(/^\/v(\d+)(?:\/|$)/);
        if (pathMatch) {
            return `v${pathMatch[1]}`;
        }
        return this.defaultVersion;
    }

    /**
     * Extract version from query parameter
     */
    extractFromQuery(req) {
        const version = req.query.version || req.query.v;
        if (version) {
            return this.normalizeVersion(version);
        }
        return this.defaultVersion;
    }

    /**
     * Extract version from Accept header
     */
    extractFromAccept(req) {
        const acceptHeader = req.headers.accept;
        if (acceptHeader) {
            const versionMatch = acceptHeader.match(/version=(\d+)/);
            if (versionMatch) {
                return `v${versionMatch[1]}`;
            }
        }
        return this.defaultVersion;
    }

    /**
     * Normalize version string
     */
    normalizeVersion(version) {
        if (typeof version === 'string') {
            // Remove 'v' prefix if present
            const cleanVersion = version.replace(/^v/, '');
            // Validate version format
            if (/^\d+$/.test(cleanVersion)) {
                return `v${cleanVersion}`;
            }
        }
        throw new Error(`Invalid version format: ${version}`);
    }

    /**
     * Get version configuration
     */
    getVersionConfig(version) {
        if (!this.supportedVersions.includes(version)) {
            throw new Error(`Version ${version} is not supported`);
        }
        
        const config = this.versionConfigs.get(version);
        if (!config) {
            throw new Error(`Configuration not found for version ${version}`);
        }
        
        return config;
    }

    /**
     * Apply version-specific middleware
     */
    applyVersionMiddleware(req, res, next, versionConfig) {
        if (versionConfig.middleware && versionConfig.middleware.length > 0) {
            let index = 0;
            
            const runMiddleware = () => {
                if (index < versionConfig.middleware.length) {
                    const middleware = versionConfig.middleware[index++];
                    middleware(req, res, (err) => {
                        if (err) {
                            return next(err);
                        }
                        runMiddleware();
                    });
                } else {
                    next();
                }
            };
            
            runMiddleware();
        } else {
            next();
        }
    }

    /**
     * Add deprecation warning to response
     */
    addDeprecationWarning(res, version, versionConfig) {
        const warning = `API version ${version} is deprecated`;
        const deprecationInfo = {
            version,
            deprecated: true,
            deprecationDate: versionConfig.deprecationDate,
            sunsetDate: versionConfig.sunsetDate,
            migrationGuide: versionConfig.migrationGuide || null
        };
        
        res.set('X-API-Version-Deprecated', 'true');
        res.set('X-API-Version-Info', JSON.stringify(deprecationInfo));
        res.set('Warning', `299 - "${warning}"`);
    }

    /**
     * Handle sunset version
     */
    handleSunsetVersion(res, version, versionConfig) {
        res.status(410).json({
            error: 'Gone',
            message: `API version ${version} has been sunset`,
            version,
            sunsetDate: versionConfig.sunsetDate,
            supportedVersions: this.supportedVersions,
            migrationGuide: versionConfig.migrationGuide || null
        });
    }

    /**
     * Handle version error
     */
    handleVersionError(res, error) {
        res.status(400).json({
            error: 'Bad Request',
            message: error.message,
            supportedVersions: this.supportedVersions,
            versioningStrategy: this.versioningStrategy
        });
    }

    /**
     * Get version information
     */
    getVersionInfo(version) {
        const config = this.versionConfigs.get(version);
        if (!config) {
            return null;
        }

        return {
            version: config.version,
            deprecated: config.deprecated,
            deprecationDate: config.deprecationDate,
            sunsetDate: config.sunsetDate,
            changelog: config.changelog,
            endpoints: Object.keys(config.endpoints),
            migrationGuide: config.migrationGuide || null
        };
    }

    /**
     * Get all versions information
     */
    getAllVersionsInfo() {
        const versions = {};
        for (const version of this.supportedVersions) {
            versions[version] = this.getVersionInfo(version);
        }
        return versions;
    }

    /**
     * Check if version is supported
     */
    isVersionSupported(version) {
        return this.supportedVersions.includes(version);
    }

    /**
     * Check if version is deprecated
     */
    isVersionDeprecated(version) {
        return this.deprecatedVersions.includes(version);
    }

    /**
     * Get migration guide for version
     */
    getMigrationGuide(fromVersion, toVersion) {
        const fromConfig = this.versionConfigs.get(fromVersion);
        const toConfig = this.versionConfigs.get(toVersion);
        
        if (!fromConfig || !toConfig) {
            return null;
        }

        return {
            from: fromVersion,
            to: toVersion,
            migrationSteps: fromConfig.migrationGuide?.[toVersion] || [],
            breakingChanges: fromConfig.breakingChanges?.[toVersion] || [],
            newFeatures: toConfig.changelog || []
        };
    }

    /**
     * Generate API documentation for version
     */
    generateApiDocs(version) {
        const config = this.versionConfigs.get(version);
        if (!config) {
            return null;
        }

        return {
            version: config.version,
            title: `ManagerAgentAI API ${version}`,
            description: config.description || `API version ${version} for ManagerAgentAI`,
            baseUrl: config.baseUrl || '/api',
            endpoints: config.endpoints,
            changelog: config.changelog,
            examples: config.examples || {},
            schemas: config.schemas || {}
        };
    }

    /**
     * Validate API request against version schema
     */
    validateRequest(req, endpoint, version) {
        const config = this.versionConfigs.get(version);
        if (!config || !config.endpoints[endpoint]) {
            return { valid: false, errors: ['Endpoint not found'] };
        }

        const endpointConfig = config.endpoints[endpoint];
        const schema = endpointConfig.schema;
        
        if (!schema) {
            return { valid: true };
        }

        // Basic validation (can be extended with JSON Schema validation)
        const errors = [];
        
        if (schema.required) {
            for (const field of schema.required) {
                if (!req.body[field] && !req.query[field] && !req.params[field]) {
                    errors.push(`Required field '${field}' is missing`);
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }
}

module.exports = VersionManager;
