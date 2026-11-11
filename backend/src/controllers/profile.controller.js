const profileService = require('../services/profile.service');
const { logAuthEvent, getClientIp } = require('../utils/authAudit');

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

        await logAuthEvent('PASSWORD_CHANGED', {
            userId: req.user.user_id,
            ip: getClientIp(req),
            userAgent: req.headers['user-agent'] || null,
        });

        res.status(200).json({ success: true, message: 'Password changed successfully.' });
    } catch (err) {
        if (err.status === 401) {
            await logAuthEvent('PASSWORD_CHANGE_FAILED', {
                userId: req.user.user_id,
                ip: getClientIp(req),
                userAgent: req.headers['user-agent'] || null,
                reason: err.message,
            }).catch(() => {});
        }
        next(err);
    }
}

module.exports = { getProfile, updateProfile, changePassword };
