import React, { useState, useEffect } from 'react';

/**
 * Trả về link ảnh đại diện tốt nhất cho user:
 * 1. Nếu có user.avatarUrl (tải lên hoặc lưu sẵn) -> Dùng avatarUrl
 * 2. Nếu có user.email -> Tự động lấy ảnh từ email (Google / Gravatar) qua Unavatar
 * 3. Fallback: UI-Avatars với ký tự đầu tên trên nền xanh nông nghiệp
 */
export function getAvatarUrl(user) {
  if (!user) return '';

  if (user.avatarUrl && typeof user.avatarUrl === 'string' && user.avatarUrl.trim()) {
    return user.avatarUrl.trim();
  }

  if (user.email && typeof user.email === 'string' && user.email.trim()) {
    const cleanEmail = encodeURIComponent(user.email.trim().toLowerCase());
    const cleanName = encodeURIComponent(user.fullName || 'User');
    return `https://unavatar.io/${cleanEmail}?fallback=https%3A%2F%2Fui-avatars.com%2Fapi%2F%3Fname%3D${cleanName}%26background%3D107C10%26color%3Dfff%26bold%3Dtrue`;
  }

  return '';
}

/**
 * Component UserAvatar hiển thị ảnh đại diện sắc nét, tự động tải ảnh từ email
 * và xử lý mượt mà khi mạng yếu hoặc ảnh lỗi.
 */
export default function UserAvatar({
  user,
  size = 40,
  className = '',
  style = {},
  alt = '',
  fontSize = null,
}) {
  const [imgError, setImgError] = useState(false);
  const avatarSrc = getAvatarUrl(user);
  const initial = user?.fullName?.trim()?.charAt(0)?.toUpperCase() || 'U';

  // Reset imgError khi avatarSrc hoặc user thay đổi
  useEffect(() => {
    setImgError(false);
  }, [avatarSrc, user?.avatarUrl, user?.email]);

  const defaultFontSize = fontSize || Math.max(12, Math.round(size * 0.42)) + 'px';

  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    borderRadius: '50%',
    overflow: 'hidden',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #107C10, #15803d)',
    color: '#ffffff',
    fontWeight: 700,
    fontSize: defaultFontSize,
    userSelect: 'none',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    ...style,
  };

  if (avatarSrc && !imgError) {
    return (
      <div className={`user-avatar-comp ${className}`} style={containerStyle}>
        <img
          src={avatarSrc}
          alt={alt || user?.fullName || 'Avatar'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            borderRadius: '50%',
          }}
          referrerPolicy="no-referrer"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`user-avatar-comp ${className}`} style={containerStyle}>
      <span>{initial}</span>
    </div>
  );
}
