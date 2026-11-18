import React, { useState } from 'react';
import { Avatar, AvatarProps } from 'antd';
import { getInitials, getAvatarColor } from '@/utils/privacyMask';

export interface UserAvatarProps extends Omit<AvatarProps, 'src'> {
  name?: string | null;
  src?: string | null;
  roleIcon?: React.ReactNode;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  src,
  roleIcon,
  size = 40,
  className = '',
  style,
  ...rest
}) => {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);

  if (src && !imgError) {
    return (
      <Avatar
        src={src}
        size={size}
        className={`shrink-0 shadow-2xs ${className}`}
        style={style}
        onError={() => {
          setImgError(true);
          return true;
        }}
        {...rest}
      />
    );
  }

  return (
    <Avatar
      size={size}
      className={`font-bold shrink-0 shadow-2xs text-white ${className}`}
      style={{
        backgroundColor: bgColor,
        ...style,
      }}
      icon={roleIcon}
      {...rest}
    >
      {!roleIcon ? initials : undefined}
    </Avatar>
  );
};

export default UserAvatar;
