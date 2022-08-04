import { useSmallLayout } from '@lyricistant/renderer/app/useSmallLayout';
import { ReactComponent as Feather } from '@lyricistant/renderer/lyricistant_feather.svg';
import { Box, Typography, useTheme } from '@mui/material';
import React from 'react';

export const NullStateText = ({ text }: { text: string }) => {
  const theme = useTheme();
  const isSmallLayout = useSmallLayout();

  return (
    <Box
      height={'100%'}
      width={'100%'}
      overflow={'hidden'}
      textOverflow={'ellipsis'}
      fontStyle={'italic'}
      p={'16px'}
      display={'flex'}
      flexWrap={'wrap-reverse'}
      gap={'12px'}
      alignItems={'center'}
      justifyContent={'center'}
      flexDirection={'column'}
    >
      {!isSmallLayout && (
        <Feather
          height={'64px'}
          width={'64px'}
          fill={theme.palette.text.disabled}
          viewBox={'0 0 100 100'}
        />
      )}
      <Typography
        sx={{
          color: theme.palette.text.disabled,
        }}
        variant={'body1'}
      >
        {text}
      </Typography>
    </Box>
  );
};
