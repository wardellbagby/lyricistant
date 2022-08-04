import { LinearProgress } from '@mui/material';
import React from 'react';

export const LoadingIndicator = (props: { display: boolean }) => (
  <LinearProgress
    sx={{
      visibility: props.display ? 'visible' : 'hidden',
      flex: '0 0 auto',
    }}
  />
);
