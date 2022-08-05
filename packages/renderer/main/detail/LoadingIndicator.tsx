import { LinearProgress } from '@mui/material';
import React from 'react';

export const LoadingIndicator = (props: { display: boolean }) => (
  <LinearProgress
    sx={{
      visibility: props.display ? 'visible' : 'hidden',
      flex: '0 0 auto',
      backgroundColor: '#00000000',
      '& .MuiLinearProgress-bar1Indeterminate': {
        backgroundColor: (theme) => theme.palette.action.disabled,
      },
      '& .MuiLinearProgress-bar2Indeterminate': {
        backgroundColor: '#00000000',
      },
    }}
  />
);
