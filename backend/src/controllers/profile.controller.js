const profileService = require('../services/profile.service');

async function getProfile(req, res, next) {
    try {
        const user = await profileService.getProfile(req.user.user_id);
        res.status(200).json({ success: true, data: { user } });
    } catch (err) {
        next(err);
    }
}

async function updateProfile(req, res, next) {
    try {
        const { fullName, email } = req.body;
        const user = await profileService.updateProfile(req.user.user_id, { fullName, email });
        res.status(200).json({
            success: true,
            message: 'Profile updated successfully.',
            data: { user },
        });
    } catch (err) {
        next(err);
    }
}

async function changePassword(req, res, next) {
    try {
        const { currentPassword, newPassword } = req.body;
        await profileService.changePassword(req.user.user_id, { currentPassword, newPassword });
        res.status(200).json({ success: true, message: 'Password changed successfully.' });
    } catch (err) {
        next(err);
    }
}

module.exports = { getProfile, updateProfile, changePassword };