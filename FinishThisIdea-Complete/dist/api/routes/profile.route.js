"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.profileRouter = void 0;
const express_1 = require("express");
const async_handler_1 = require("../../utils/async-handler");
const errors_1 = require("../../utils/errors");
const logger_1 = require("../../utils/logger");
const profile_service_1 = require("../../services/profile.service");
const context_profile_1 = require("../../types/context-profile");
const auth_middleware_1 = require("../../middleware/auth.middleware");
const router = (0, express_1.Router)();
exports.profileRouter = router;
router.use(auth_middleware_1.requireAuth);
const createProfileSchema = context_profile_1.contextProfileSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    createdBy: true,
    isDefault: true,
});
const updateProfileSchema = context_profile_1.contextProfileSchema.partial().omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    createdBy: true,
    isDefault: true,
});
router.get('/', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { includeDefaults = true } = req.query;
    const profiles = await profile_service_1.profileService.listProfiles(userId);
    const filteredProfiles = includeDefaults === 'false'
        ? profiles.filter(p => !p.isDefault)
        : profiles;
    res.json({
        success: true,
        data: filteredProfiles,
        count: filteredProfiles.length,
    });
}));
router.get('/suggest', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { language, framework } = req.query;
    if (!language) {
        throw new errors_1.AppError('Language parameter is required', 400, 'MISSING_LANGUAGE');
    }
    const profile = await profile_service_1.profileService.getSuggestedProfile(language, framework);
    if (!profile) {
        return res.json({
            success: true,
            data: null,
            message: 'No suggested profile found for this language/framework',
        });
    }
    res.json({
        success: true,
        data: profile,
    });
}));
router.get('/:id', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const profile = await profile_service_1.profileService.getProfile(id, userId);
    if (!profile) {
        throw new errors_1.AppError('Profile not found', 404, 'PROFILE_NOT_FOUND');
    }
    res.json({
        success: true,
        data: profile,
    });
}));
router.post('/', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const profileData = createProfileSchema.parse(req.body);
    const profile = await profile_service_1.profileService.createProfile(profileData, userId);
    logger_1.logger.info('Profile created', {
        profileId: profile.id,
        userId,
        name: profile.name,
    });
    res.status(201).json({
        success: true,
        data: profile,
    });
}));
router.put('/:id', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = updateProfileSchema.parse(req.body);
    const profile = await profile_service_1.profileService.updateProfile(id, updates, userId);
    logger_1.logger.info('Profile updated', {
        profileId: id,
        userId,
    });
    res.json({
        success: true,
        data: profile,
    });
}));
router.delete('/:id', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    await profile_service_1.profileService.deleteProfile(id, userId);
    logger_1.logger.info('Profile deleted', {
        profileId: id,
        userId,
    });
    res.json({
        success: true,
        message: 'Profile deleted successfully',
    });
}));
router.post('/:id/clone', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { name } = req.body;
    if (!name) {
        throw new errors_1.AppError('New profile name is required', 400, 'MISSING_NAME');
    }
    const profile = await profile_service_1.profileService.cloneProfile(id, name, userId);
    logger_1.logger.info('Profile cloned', {
        sourceProfileId: id,
        newProfileId: profile.id,
        userId,
    });
    res.status(201).json({
        success: true,
        data: profile,
    });
}));
router.get('/:id/export', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;
    const json = await profile_service_1.profileService.exportProfile(id, userId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="profile-${id}.json"`);
    res.send(json);
}));
router.post('/import', (0, async_handler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.id;
    const { json } = req.body;
    if (!json) {
        throw new errors_1.AppError('JSON content is required', 400, 'MISSING_JSON');
    }
    const profile = await profile_service_1.profileService.importProfile(json, userId);
    logger_1.logger.info('Profile imported', {
        profileId: profile.id,
        userId,
        name: profile.name,
    });
    res.status(201).json({
        success: true,
        data: profile,
    });
}));
//# sourceMappingURL=profile.route.js.map