import { ReactComponent as Feather } from '@lyricistant/renderer/lyricistant_feather.svg';
import { Box, Typography, useTheme } from '@mui/material';
import React from 'react';

/**
 * Displays a "null state text" showing a message that should be displayed when
 * loading has failed or otherwise couldn't start.
 *
 * Displays the text and the icon of Lyricistant.
 *
 * @param text The text to display.
 * @param visible Whether this should be displayed. Useful for performance
 *   optimization; if this is meant to be displayed as a replacement for a list
 *   that could be expensive to render, having this always be rendered but
 *   hidden can help prevent re-renders.
 */
export const NullStateText = ({
  text,
  visible,
}: {
  text: string;
  visible: boolean;
}) => {
  const theme = useTheme();

  return (
    <Box
      height={'100%'}
      width={'100%'}
      overflow={'hidden'}
      textOverflow={'ellipsis'}
      fontStyle={'italic'}
      p={'16px'}
      display={visible === true ? 'flex' : 'none'}
      flexWrap={'wrap-reverse'}
      gap={'12px'}
      alignItems={'center'}
      justifyContent={'center'}
      flexDirection={'column'}
    >
      <Feather
        height={'64px'}
        width={'64px'}
        fill={theme.palette.text.disabled}
        viewBox={'0 0 100 100'}
      />
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
