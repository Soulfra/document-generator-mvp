import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../utils/async-handler';
import { AppError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { profileService } from '../../services/profile.service';
import { contextProfileSchema } from '../../types/context-profile';
import { requireAuth } from '../../middleware/require-auth.middleware';

const router = Router();

// Apply auth middleware to all routes
router.use(requireAuth);

// Schema for creating a new profile
const createProfileSchema = contextProfileSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  isDefault: true,
});

// Schema for updating a profile
const updateProfileSchema = contextProfileSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  isDefault: true,
});

/**
 * GET /api/profiles
 * List all available profiles
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { includeDefaults = true } = req.query;

    const profiles = await profileService.listProfiles(userId);
    
    // Filter out defaults if requested
    const filteredProfiles = includeDefaults === 'false' 
      ? profiles.filter(p => !p.isDefault)
      : profiles;

    res.json({
      success: true,
      data: filteredProfiles,
      count: filteredProfiles.length,
    });
  })
);

/**
 * GET /api/profiles/suggest
 * Get suggested profile for language/framework
 */
router.get(
  '/suggest',
  asyncHandler(async (req, res) => {
    const { language, framework } = req.query;

    if (!language) {
      throw new AppError('Language parameter is required', 400, 'MISSING_LANGUAGE');
    }

    const profile = await profileService.getSuggestedProfile(
      language as string,
      framework as string | undefined
    );

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
  })
);

/**
 * GET /api/profiles/:id
 * Get a specific profile
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const profile = await profileService.getProfile(id, userId);

    if (!profile) {
      throw new AppError('Profile not found', 404, 'PROFILE_NOT_FOUND');
    }

    res.json({
      success: true,
      data: profile,
    });
  })
);

/**
 * POST /api/profiles
 * Create a new custom profile
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const profileData = createProfileSchema.parse(req.body);

    const profile = await profileService.createProfile(profileData, userId);

    logger.info('Profile created', {
      profileId: profile.id,
      userId,
      name: profile.name,
    });

    res.status(201).json({
      success: true,
      data: profile,
    });
  })
);

/**
 * PUT /api/profiles/:id
 * Update a custom profile
 */
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const updates = updateProfileSchema.parse(req.body);

    const profile = await profileService.updateProfile(id, updates, userId);

    logger.info('Profile updated', {
      profileId: id,
      userId,
    });

    res.json({
      success: true,
      data: profile,
    });
  })
);

/**
 * DELETE /api/profiles/:id
 * Delete a custom profile
 */
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    await profileService.deleteProfile(id, userId);

    logger.info('Profile deleted', {
      profileId: id,
      userId,
    });

    res.json({
      success: true,
      message: 'Profile deleted successfully',
    });
  })
);

/**
 * POST /api/profiles/:id/clone
 * Clone an existing profile
 */
router.post(
  '/:id/clone',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { name } = req.body;

    if (!name) {
      throw new AppError('New profile name is required', 400, 'MISSING_NAME');
    }

    const profile = await profileService.cloneProfile(id, name, userId);

    logger.info('Profile cloned', {
      sourceProfileId: id,
      newProfileId: profile.id,
      userId,
    });

    res.status(201).json({
      success: true,
      data: profile,
    });
  })
);

/**
 * GET /api/profiles/:id/export
 * Export profile as JSON
 */
router.get(
  '/:id/export',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const json = await profileService.exportProfile(id, userId);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="profile-${id}.json"`);
    res.send(json);
  })
);

/**
 * POST /api/profiles/import
 * Import profile from JSON
 */
router.post(
  '/import',
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { json } = req.body;

    if (!json) {
      throw new AppError('JSON content is required', 400, 'MISSING_JSON');
    }

    const profile = await profileService.importProfile(json, userId);

    logger.info('Profile imported', {
      profileId: profile.id,
      userId,
      name: profile.name,
    });

    res.status(201).json({
      success: true,
      data: profile,
    });
  })
);

export { router as profileRouter };